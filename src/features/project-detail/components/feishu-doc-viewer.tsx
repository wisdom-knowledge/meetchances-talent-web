import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFeishuAppAuth } from '../api'

// 云文档组件的错误码（根据飞书官方文档）
enum ERROR_TYPE {
  NO_PERMISSION = '4', // 无阅读权限
  NOTE_DELETED = '1002', // 文档删除
  NOT_FOUND = '1004', // 找不到文档
  NETWORK_ERR = '-8', // 加载时网络错误
  REQUEST_FAIL = '1', // 请求后端发生错误
  NOT_SUPPORT = '-100', // 不支持该地址
  LOAD_ERROR = '-500', // 加载错误
}

// 错误码对应的错误信息（保留以备将来使用）
const _ERROR_MESSAGES: Record<string, string> = {
  [ERROR_TYPE.NO_PERMISSION]: '无阅读权限，请检查文档权限设置',
  [ERROR_TYPE.NOTE_DELETED]: '文档已被删除',
  [ERROR_TYPE.NOT_FOUND]: '找不到文档，请检查文档链接是否正确',
  [ERROR_TYPE.NETWORK_ERR]: '网络错误，请检查网络连接',
  [ERROR_TYPE.REQUEST_FAIL]: '请求后端发生错误，请稍后重试',
  [ERROR_TYPE.NOT_SUPPORT]: '不支持该文档地址格式',
  [ERROR_TYPE.LOAD_ERROR]: '文档加载错误',
}

// DocComponentSdk 构造函数选项
interface DocComponentSdkOptions {
  src?: string // 文档对应 URL
  mount?: HTMLElement | null // 挂载节点
  config?: {
    theme?: 'light' | 'dark' // 组件主题色（不支持 mobile）
    size?: {
      width?: string | number // 组件宽度，默认 100%
      height?: string | number // 组件高度，默认 auto
      minHeight?: string | number // 组件最小高度，当 height 为 auto 时，默认值为 500px
    }
    extensions?: {
      like?: {
        disable?: boolean // 隐藏点赞
      }
      suiteNavBar?: {
        disable?: boolean // 隐藏导航栏
      }
      // 可以添加其他扩展配置
    }
    isShowHeader?: boolean // 是否显示头部（如果 SDK 支持）
  }
  auth?: {
    openId?: string // 当前登录用户的open id，使用 app_access_token 时此项不填
    signature?: string // 签名
    appId: string // 应用 appId
    timestamp?: number // 时间戳（毫秒）
    nonceStr?: string // 随机字符串
    url?: string // 参与签名加密计算的url
    jsApiList?: string[] // 指定要使用的组件，如 ['DocsComponent']
  }
  onError?: (error: unknown) => void // 组件内部错误回调
  onAuthError?: (error: unknown) => void // 鉴权失败回调
  onMountSuccess?: () => void // 挂载成功回调
  onMountTimeout?: () => void // 挂载超时回调
}

// 组件实例接口定义
interface FeishuComponentInstance {
  start: () => Promise<void> // 启动组件
  destroy: () => void // 销毁组件
  invoke: (event: string, ...args: unknown[]) => Promise<{ code: string; msg: string }> // 调用接口
  register: (event: string, callback: (...args: unknown[]) => void) => void // 事件监听
  setFeatureConfig?: (config: {
    extensions?: {
      suiteNavBar?: {
        disable?: boolean
      }
      like?: {
        disable?: boolean
      }
      header?: {
        disable?: boolean
      }
      fullscreen?: {
        disable?: boolean // 隐藏全屏按钮
      }
      toolbar?: {
        disable?: boolean // 隐藏工具栏
      }
    }
  }) => void // 设置功能配置（根据飞书官方文档）
}

// 扩展 Window 类型以支持飞书 SDK
declare global {
  interface Window {
    // 新版 SDK (1.0.13) - CDN 方式
    DocComponentSdk?: new (options: DocComponentSdkOptions) => FeishuComponentInstance
    Lark?: unknown
  }
}

interface FeishuDocViewerProps {
  /**
   * 飞书文档 URL，例如：https://meetchances.feishu.cn/docx/xxx
   */
  docUrl: string
  className?: string
  onLoad?: () => void
}

/**
 * 从飞书文档 URL 中提取文档 token 和文档类型
 * 
 * 支持的 URL 格式：
 * - https://meetchances.feishu.cn/wiki/IN3RwNIMRiKlOikpyJKcljcznLe (wiki 文档)
 * - https://meetchances.feishu.cn/docx/IN3RwNIMRiKlOikpyJKcljcznLe (docx 文档)
 * - docx://open.feishu.cn/docx/IN3RwNIMRiKlOikpyJKcljcznLe
 * 
 * 注意：飞书 Web Components SDK 可能不支持 wiki 类型，需要转换为 docx URL
 */
function extractDocInfo(url: string): { token: string; docType: 'wiki' | 'docx' | 'unknown'; originalUrl: string } | null {
  try {
    // 处理 docx:// 协议
    if (url.startsWith('docx://')) {
      const match = url.match(/docx:\/\/[^/]+\/([^/?]+)/)
      if (match) {
        return {
          token: match[1],
          docType: 'docx',
          originalUrl: url,
        }
      }
      return null
    }

    // 处理 https:// 协议
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    if (pathParts.length >= 2) {
      const docType = pathParts[0] as 'wiki' | 'docx' | 'unknown' // wiki 或 docx
      const token = pathParts[pathParts.length - 1]
      
      return {
        token,
        docType: docType === 'wiki' || docType === 'docx' ? docType : 'unknown',
        originalUrl: url,
      }
    }
    
    return null
  } catch {
    return null
  }
}

// 扩展 JSX 类型以支持飞书 Web Components
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'lark-doc-viewer': {
        token?: string
        'app-id'?: string
        ticket?: string
        'app-access-token'?: string
        mode?: 'view' | 'edit'
        className?: string
        style?: React.CSSProperties
        ref?: React.Ref<HTMLElement>
      }
    }
  }
}

/**
 * 检查飞书 SDK 是否已加载
 * 根据官方文档：https://open.larkoffice.com/document/common-capabilities/web-components/uYDO3YjL2gzN24iN3cjN/introduction
 */
function isLarkSDKReady(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }
  
  try {
    // 检查 SDK 脚本是否已加载
    const scripts = Array.from(document.querySelectorAll('script'))
    const sdkScript = scripts.find(
      (script) =>
        script.src.includes('docComponentSdk') ||
        script.src.includes('feishu-static') ||
        script.src.includes('feishu-web-component')
    )
    
    if (!sdkScript) {
      return false
    }
    
    // 检查脚本是否加载完成
    if (sdkScript.src && !sdkScript.onload && document.readyState !== 'complete') {
      return false
    }
    
    // 检查 DocComponentSdk（新版 SDK）
    if (window.DocComponentSdk) {
      return true
    }
    
    return false
  } catch {
    return false
  }
}

/**
 * 等待飞书 SDK 加载完成
 * 增加等待时间和重试次数，确保 SDK 完全加载
 */
function waitForLarkSDK(maxAttempts = 100, interval = 200): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    
    // 先检查脚本是否已加载
    const scripts = Array.from(document.querySelectorAll('script'))
    const sdkScript = scripts.find(
      (script) =>
        script.src.includes('docComponentSdk') ||
        script.src.includes('feishu-static') ||
        script.src.includes('feishu-web-component')
    )
    
    if (!sdkScript) {
      resolve(false)
      return
    }
    
    if (isLarkSDKReady()) {
      resolve(true)
      return
    }
    
    let attempts = 0
    const checkSDK = () => {
      attempts++
      
      if (isLarkSDKReady()) {
        resolve(true)
        return
      }
      
      if (attempts >= maxAttempts) {
        resolve(false)
        return
      }
      
      setTimeout(checkSDK, interval)
    }
    
    // 延迟开始检查，给脚本一些加载时间
    setTimeout(checkSDK, 500)
  })
}

export function FeishuDocViewer({ docUrl, className, onLoad }: FeishuDocViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null) // 组件挂载点
  const componentInstanceRef = useRef<FeishuComponentInstance | null>(null) // 组件实例
  const usedSignatureRef = useRef<string | null>(null) // 已使用过的签名，避免重复使用
  const isCreatingRef = useRef<boolean>(false) // 是否正在创建组件，防止并发创建
  const createdKeyRef = useRef<string | null>(null) // 已创建组件的唯一标识（docToken + signature），用于判断是否需要重新创建
  const isMountedRef = useRef<boolean>(false) // 组件是否已成功挂载，用于判断非关键错误是否应该显示
  const docLoadStartTimeRef = useRef<number | null>(null) // 文档加载开始的时间戳（在 onMountSuccess 中设置）
  const hideLoadingTimerRef = useRef<NodeJS.Timeout | null>(null) // 2秒后隐藏 loading 的定时器
  const [docToken, setDocToken] = useState<string | null>(null)
  const [docType, setDocType] = useState<'wiki' | 'docx' | 'unknown'>('unknown')
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [isComponentReady, setIsComponentReady] = useState(false) // 组件是否真正准备好显示文档
  const [showGettingDoc, setShowGettingDoc] = useState(false) // 是否显示"获取文档中..."
  
  // 提取文档 token 和类型
  useEffect(() => {
    if (docUrl) {
      const docInfo = extractDocInfo(docUrl)
      
      if (!docInfo) {
        setSdkError('无法从文档 URL 中提取信息，请检查 URL 格式')
        return
      }
      
      setDocToken(docInfo.token)
      setDocType(docInfo.docType)
    }
  }, [docUrl])

  // 获取当前页面 URL（不包含查询参数和 hash，用于传递给后端 API）
  // 根据飞书 API 文档：调用飞书组件的页面的 url，不要包括 #、? 后面的参数
  // 使用 useMemo 确保 URL 值稳定，避免不必要的重新请求
  const currentPageUrlForAuth = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const url = window.location.href
    // 移除查询参数（?）和 hash（#）部分
    return url.split('?')[0].split('#')[0]
  }, [])

  // 从 API 获取飞书应用鉴权信息（实时获取，不缓存）
  // 只有当 docToken 存在时才发起请求
  const {
    data: authData,
    isLoading: authLoading,
    error: authError,
  } = useFeishuAppAuth(!!docToken, docToken || undefined, currentPageUrlForAuth)

  // 等待 SDK 加载
  useEffect(() => {
    const checkSDK = async () => {
      // 等待 SDK 初始化
      const ready = await waitForLarkSDK()
      
      if (!ready) {
        const errorMsg = '飞书 SDK 加载失败，请检查网络连接或刷新页面重试'
        setSdkError(errorMsg)
        setSdkReady(false)
        return
      }
      
      // 检查 DocComponentSdk 是否存在
      if (!window.DocComponentSdk) {
        setSdkError('SDK 未正确加载，window.DocComponentSdk 不存在。请检查 SDK 版本或刷新页面重试')
        setSdkReady(false)
        return
      }
      
      setSdkReady(true)
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(checkSDK, 100)
    } else {
      const handleLoad = () => setTimeout(checkSDK, 100)
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  // 使用 useLayoutEffect 确保在 DOM 更新后、浏览器绘制前执行
  // 这样可以确保容器已经挂载到 DOM 后再创建 DocComponentSdk 实例
  // 根据飞书官方文档：需要在组件挂载之后才执行 new window.DocComponentSdk
  useLayoutEffect(() => {
    // 严格检查：必须同时满足所有条件才继续
    // 1. docToken 必须存在
    // 2. authData 必须有值（不能是 undefined 或 null）
    // 3. sdkReady 必须为 true
    // 4. authLoading 必须为 false（不在加载中）
    if (!docToken || !sdkReady || authLoading || !authData) {
      return
    }
    
    // 确保 authData 有必要的字段
    if (!authData.app_id || !authData.signature) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }
    
    // 确保容器已经挂载到 DOM 中
    // useLayoutEffect 会在 DOM 更新后同步执行，此时容器应该已经挂载
    // 但为了保险起见，仍然检查 isConnected
    if (!container.isConnected) {
      // 如果仍未挂载，延迟一点再检查（使用 setTimeout 确保在下一事件循环）
      setTimeout(() => {
        // 延迟后再次检查，如果仍未挂载则返回
        if (!containerRef.current?.isConnected) {
          return
        }
        // 如果已挂载，继续执行（但这里无法直接继续，需要重新触发 useEffect）
        // 所以这里直接返回，让 useLayoutEffect 在下一轮检查
      }, 0)
      return
    }
    
    // 获取用于签名验证的 URL
    // 根据飞书 API 文档：调用飞书组件的页面的 url，不要包括 #、? 后面的参数
    // 服务端返回的 authData.url 已经是正确的格式（不包含查询参数和 hash）
    const currentUrl = window.location.href
    const authUrl = authData.url || currentUrl.split('?')[0].split('#')[0]
    
    // 生成唯一标识：docToken + signature，用于判断是否需要重新创建
    const currentSignature = authData.signature || ''
    const componentKey = `${docToken}_${currentSignature}`
    
    // 严格检查：如果正在创建，直接返回
    if (isCreatingRef.current) {
      return
    }
    
    // 严格检查：如果已经成功创建过相同的组件（相同的 docToken + signature），直接返回
    if (createdKeyRef.current === componentKey && componentInstanceRef.current) {
      // 如果组件已存在，确保状态正确
      if (!isComponentReady) {
        setIsComponentReady(true)
      }
      return
    }
    
    // 如果组件标识变化（docToken 或 signature 变化），需要销毁旧实例
    if (createdKeyRef.current && createdKeyRef.current !== componentKey) {
      // 销毁旧实例
      if (componentInstanceRef.current) {
        try {
          componentInstanceRef.current.destroy()
        } catch {
          // 忽略销毁错误
        }
        componentInstanceRef.current = null
      }
      
      // 清除相关记录
      usedSignatureRef.current = null
      createdKeyRef.current = null
      setIsComponentReady(false) // 清除组件准备状态，显示 loading
    }

    // 检查签名是否已经被使用过（额外保护）
    if (currentSignature && usedSignatureRef.current === currentSignature) {
      // 如果组件实例已存在且签名匹配，说明已经成功创建，不需要重新创建
      if (componentInstanceRef.current) {
        return
      }
      // 如果组件实例不存在但签名已使用，清除签名记录并允许重新创建
      usedSignatureRef.current = null
    }

    // 检查 DocComponentSdk 是否可用
    if (!window.DocComponentSdk) {
      setSdkError('SDK 构造函数不可用，请检查 SDK 是否正确加载')
      return
    }

    // 确保文档 URL 是完整的 URL（不是相对路径）
    let finalDocUrl = docUrl
    if (!docUrl.startsWith('http://') && !docUrl.startsWith('https://') && !docUrl.startsWith('docx://')) {
      // 如果是相对路径，尝试构建完整 URL
      if (docToken) {
        finalDocUrl = `https://meetchances.feishu.cn/docx/${docToken}`
      }
    }

    // 设置创建标志，防止并发创建
    isCreatingRef.current = true
    setIsComponentReady(false) // 重置组件准备状态，显示 loading
    
    try {
      // 创建组件实例
      // 注意：需要给文档设置一个固定高度，否则会全量加载文档，有性能问题
      const componentInstance = new window.DocComponentSdk({
        src: finalDocUrl, // 文档对应 URL（必须是完整的 URL）
        mount: container, // 挂载节点
        config: {
          theme: 'light', // 组件主题色，可选值：light、dark（不支持 mobile）
          size: {
            width: '100%', // 组件宽度，默认 100%
            height: 'auto', // 组件高度，默认 auto
            minHeight: '500px', // 组件最小高度，当 height 为 auto 时，默认值为 500px
          },
        },
        auth: {
          // 使用签名验证时，需要提供以下参数
          signature: authData.signature, // 签名
          appId: authData.app_id, // 应用 appId
          timestamp: authData.timestamp, // 时间戳（毫秒）
          nonceStr: authData.noncestr, // 随机字符串
          url: authUrl, // 参与签名加密计算的url（必须与实际页面 URL 完全一致）
          jsApiList: ['DocsComponent'], // 指定要使用的组件
        },
        // 捕获 SDK 鉴权错误
        onAuthError: (error: unknown) => {
          // 尝试多种方式提取错误信息
          let errorCode: string | undefined
          let errorMsg: string | undefined
          
          if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>
            errorCode = 
              (errorObj.code as string) || 
              (errorObj.errorCode as string) || 
              (errorObj.errCode as string) ||
              (errorObj.status as string) ||
              undefined
            
            errorMsg = 
              (errorObj.msg as string) || 
              (errorObj.message as string) || 
              (errorObj.errorMsg as string) ||
              (errorObj.errMsg as string) ||
              (errorObj.error as string) ||
              undefined
          } else if (error instanceof Error) {
            errorMsg = error.message
            errorCode = error.name !== 'Error' ? error.name : undefined
          } else if (typeof error === 'string') {
            errorMsg = error
          } else {
            errorMsg = String(error)
          }
          
          const errorMessage = errorCode 
            ? (_ERROR_MESSAGES[errorCode] || errorMsg || '鉴权失败，请检查应用配置')
            : (errorMsg || '鉴权失败，请检查应用配置')
          
          setSdkError(`鉴权错误${errorCode ? ` (${errorCode})` : ''}: ${errorMessage}`)
        },
        // 捕获组件内部错误
        onError: (error: unknown) => {
          // 尝试多种方式提取错误信息
          let errorCode: string | undefined
          let errorMsg: string | undefined
          
          if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>
            errorCode = 
              (errorObj.code as string) || 
              (errorObj.errorCode as string) || 
              (errorObj.errCode as string) ||
              (errorObj.status as string) ||
              undefined
            
            errorMsg = 
              (errorObj.msg as string) || 
              (errorObj.message as string) || 
              (errorObj.errorMsg as string) ||
              (errorObj.errMsg as string) ||
              (errorObj.error as string) ||
              undefined
          } else if (error instanceof Error) {
            errorMsg = error.message
            errorCode = error.name !== 'Error' ? error.name : undefined
          } else if (typeof error === 'string') {
            errorMsg = error
          } else {
            errorMsg = String(error)
          }
          
          const errorMessage = errorCode 
            ? (_ERROR_MESSAGES[errorCode] || errorMsg || '文档加载失败')
            : (errorMsg || '文档加载失败')
          
          // 如果组件已经成功挂载，某些非关键错误（如错误码 1 - REQUEST_FAIL）可能是 SDK 内部的非关键操作失败
          // 例如：获取用户信息失败，但不影响文档显示
          // 这种情况下，不显示错误提示给用户
          if (isMountedRef.current && errorCode === ERROR_TYPE.REQUEST_FAIL) {
            return
          }
          
          // 根据错误码显示具体错误信息
          let userMessage = errorMessage
          if (errorCode) {
            switch (errorCode) {
              case ERROR_TYPE.NO_PERMISSION:
                userMessage = '无阅读权限，请联系文档所有者授予权限'
                break
              case ERROR_TYPE.NOTE_DELETED:
                userMessage = '文档已被删除'
                break
              case ERROR_TYPE.NOT_FOUND:
                userMessage = '找不到文档，请检查文档链接是否正确'
                break
              case ERROR_TYPE.NETWORK_ERR:
                userMessage = '网络错误，请检查网络连接后重试'
                break
              case ERROR_TYPE.REQUEST_FAIL:
                userMessage = '请求失败，请稍后重试'
                break
              case ERROR_TYPE.NOT_SUPPORT:
                if (docType === 'wiki') {
                  userMessage = `不支持的文档类型：wiki。SDK 可能不支持 wiki 文档，请尝试使用 docx 格式的 URL。当前文档 token: ${docToken}`
                } else if (docType === 'docx') {
                  userMessage = `不支持的文档地址格式（-100）。文档类型为 docx，但 SDK 返回不支持错误。请检查：1) Token 是否正确 (${docToken})；2) 鉴权信息是否有效；3) 文档是否存在且有权限访问`
                } else {
                  userMessage = `不支持的文档地址格式（-100）。文档类型: ${docType}，Token: ${docToken}`
                }
                break
              case ERROR_TYPE.LOAD_ERROR:
                userMessage = `文档加载错误（-500）。请检查：1) 文档 URL 是否正确 (${docUrl})；2) 文档 Token 是否正确 (${docToken})；3) 鉴权信息是否有效；4) 签名验证 URL 是否正确（${authData.url}，应不包含查询参数和 hash）`
                break
            }
          }
          
          setSdkError(`加载错误${errorCode ? ` (${errorCode})` : ''}: ${userMessage}`)
        },
        // 挂载成功回调
        onMountSuccess: () => {
          isMountedRef.current = true // 标记组件已成功挂载
          
          // 记录挂载成功时间，用于显示"获取文档中..."至少2秒
          docLoadStartTimeRef.current = Date.now()
          
          // 使用 setFeatureConfig 设置功能配置（根据飞书官方文档）
          // 在挂载成功后调用，可以动态更新配置
          // 注意：componentInstance 在闭包中可访问
          if (componentInstance && componentInstance.setFeatureConfig) {
            componentInstance.setFeatureConfig({
              extensions: {
                suiteNavBar: {
                  disable: true, // 隐藏导航栏
                },
                like: {
                  disable: true, // 隐藏点赞
                },
                header: {
                  disable: true, // 隐藏头部（包括分享和更多菜单）
                },
                fullscreen: {
                  disable: true, // 隐藏全屏按钮
                },
              },
            })
          }
          
          // 移除加载中的元素
          const loadingElement = containerRef.current?.querySelector('#loading')
          if (loadingElement) {
            loadingElement.remove()
          }
          
          // 如果配置不生效，使用 CSS 隐藏全屏按钮
          setTimeout(() => {
            const style = document.createElement('style')
            style.id = 'feishu-hide-fullscreen'
            style.textContent = `
              /* 隐藏飞书文档的全屏按钮 */
              [class*="fullscreen"],
              [class*="Fullscreen"],
              [class*="full-screen"],
              [class*="FullScreen"],
              button[aria-label*="全屏"],
              button[aria-label*="fullscreen"],
              button[title*="全屏"],
              button[title*="fullscreen"],
              [data-testid*="fullscreen"],
              [data-testid*="Fullscreen"] {
                display: none !important;
                visibility: hidden !important;
              }
            `
            // 如果样式已存在，先移除
            const existingStyle = document.getElementById('feishu-hide-fullscreen')
            if (existingStyle) {
              existingStyle.remove()
            }
            document.head.appendChild(style)
            
            // 同时尝试直接操作 DOM 元素
            const containerElement = containerRef.current
            if (containerElement) {
              // 查找并隐藏全屏按钮
              const fullscreenButtons = containerElement.querySelectorAll(
                'button, [role="button"], [class*="button"]'
              )
              fullscreenButtons.forEach((el) => {
                const element = el as HTMLElement
                const text = element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || ''
                const className = element.className || ''
                // 如果包含"全屏"或"fullscreen"相关的文本或类名，隐藏它
                if (
                  text.includes('全屏') || 
                  text.toLowerCase().includes('fullscreen') ||
                  className.toLowerCase().includes('fullscreen')
                ) {
                  element.style.display = 'none'
                  element.style.visibility = 'hidden'
                }
              })
            }
          }, 1500) // 延迟 1.5 秒，确保文档已完全加载
          
          // 清理之前的定时器
          if (hideLoadingTimerRef.current) {
            clearTimeout(hideLoadingTimerRef.current)
            hideLoadingTimerRef.current = null
          }
          
          // 2秒后自动隐藏"获取文档中..."
          hideLoadingTimerRef.current = setTimeout(() => {
            setIsComponentReady(true)
            docLoadStartTimeRef.current = null
            hideLoadingTimerRef.current = null
            onLoad?.()
          }, 2000)
          
          setSdkError(null)
        },
        // 挂载超时回调
        onMountTimeout: () => {
          setSdkError('组件挂载超时，请刷新页面重试')
        },
      })
      
      // 保存组件实例，以便后续销毁
      componentInstanceRef.current = componentInstance
      
      // 重置组件准备状态，显示 loading（在创建实例后，启动前）
      setIsComponentReady(false)
      
      // 启动组件（必须在 start() 回调中调用接口和监听事件）
      componentInstance.start()
        .then(() => {
          // 组件启动成功后才记录签名和组件标识，避免启动失败时签名被占用
          if (currentSignature) {
            usedSignatureRef.current = currentSignature
          }
          
          // 记录组件创建成功的标识，确保不会重复创建
          createdKeyRef.current = componentKey
          
          // 清除创建标志
          isCreatingRef.current = false
          
          // 清除之前的错误状态
          setSdkError(null)
          
          // 设置事件监听：监听文档标题变化（必须在 start() 回调中监听）
          componentInstance.register('SUITE_TITLE_CHANGE', () => {
            // 可以在这里处理标题变化，比如更新页面标题
          })
          
          // 示例：调用接口打开文档详情（必须在 start() 回调中调用）
          // componentInstance.invoke('TOGGLE_MODAL', 'DETAIL', true)
          //   .then((response: { code: string; msg: string }) => {
          //     const { code, msg } = response
          //     if (code === '0' || code === '200') {
          //       // 处理文档信息
          //     }
          //   })
          //   .catch((error: unknown) => {
          //     // 处理错误
          //   })
        })
        .catch((error: unknown) => {
          // 启动失败时清除组件实例和创建标志，允许重试
          componentInstanceRef.current = null
          isCreatingRef.current = false
          isMountedRef.current = false // 清除挂载标志
          setIsComponentReady(false) // 清除组件准备状态
          setShowGettingDoc(false) // 清除显示"获取文档中..."的状态
          docLoadStartTimeRef.current = null // 清除文档加载开始时间
          
          // 清理隐藏 loading 的定时器
          if (hideLoadingTimerRef.current) {
            clearTimeout(hideLoadingTimerRef.current)
            hideLoadingTimerRef.current = null
          }
          
          // 清除签名记录，允许使用新签名重试
          if (currentSignature && usedSignatureRef.current === currentSignature) {
            usedSignatureRef.current = null
          }
          // 清除组件标识，允许重新创建（因为启动失败，需要重新创建）
          createdKeyRef.current = null
          
          setSdkError(`组件启动失败: ${error instanceof Error ? error.message : String(error)}`)
        })
    } catch (error) {
      // 创建失败时清除组件实例、签名记录和创建标志，允许重试
      componentInstanceRef.current = null
      isCreatingRef.current = false
      isMountedRef.current = false // 清除挂载标志
      setIsComponentReady(false) // 清除组件准备状态
      docLoadStartTimeRef.current = null // 清除文档加载开始时间
      
      // 清理隐藏 loading 的定时器
      if (hideLoadingTimerRef.current) {
        clearTimeout(hideLoadingTimerRef.current)
        hideLoadingTimerRef.current = null
      }
      
      createdKeyRef.current = null
      if (currentSignature && usedSignatureRef.current === currentSignature) {
        usedSignatureRef.current = null
      }
      
      setSdkError(`组件创建失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // 清理函数：组件卸载时销毁实例
    return () => {
      // 清理隐藏 loading 的定时器
      if (hideLoadingTimerRef.current) {
        clearTimeout(hideLoadingTimerRef.current)
        hideLoadingTimerRef.current = null
      }
      
      // 清除文档加载开始时间和显示状态
      docLoadStartTimeRef.current = null
      setShowGettingDoc(false)
      
      if (componentInstanceRef.current) {
        try {
          componentInstanceRef.current.destroy()
        } catch {
          // 忽略清理错误
        }
        componentInstanceRef.current = null
        // 清除所有相关记录，允许使用新的签名和创建新组件
        usedSignatureRef.current = null
        isCreatingRef.current = false
        isMountedRef.current = false // 清除挂载标志
        createdKeyRef.current = null
      }
    }
    // 依赖项：只包含真正影响组件创建的关键值
    // - docToken: 文档 token 变化时需要重新创建
    // - authData: 鉴权数据变化时需要重新创建（包含 signature、app_id 等所有必要字段）
    // - sdkReady: SDK 就绪状态变化时需要重新创建
    // - authLoading: 加载状态变化时需要重新检查
    // 注意：不包含 onLoad、docUrl、docType，因为它们不应该触发组件重新创建
    // 通过严格的早期返回检查和 createdKeyRef 来避免重复执行
    // 容器挂载检查通过 isConnected 在运行时检查，不需要添加到依赖项
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docToken, authData, sdkReady, authLoading])

  if (!sdkReady) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-white'>
        <div className='flex flex-col items-center gap-3'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
          <p className='text-sm text-black/60'>正在加载飞书 SDK...</p>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-white'>
        <div className='flex flex-col items-center gap-3'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
          <p className='text-sm text-black/60'>正在获取鉴权信息...</p>
        </div>
      </div>
    )
  }

  // 只有在组件挂载成功后（onMountSuccess 触发）才显示"获取文档中..."
  // 2秒后自动隐藏（在 onMountSuccess 中设置定时器）
  if (showGettingDoc) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-white'>
        <div className='flex flex-col items-center justify-center gap-3'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
          <p className='text-sm text-black/60 text-center'>获取文档中...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-white'>
        <div className='flex flex-col items-center gap-2 text-center px-4'>
          <p className='text-sm text-red-600 font-medium'>获取鉴权信息失败</p>
          <p className='text-xs text-black/40 mt-1'>
            {authError instanceof Error ? authError.message : '请检查网络连接或刷新页面重试'}
          </p>
        </div>
      </div>
    )
  }

  if (sdkError) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-white'>
        <div className='flex flex-col items-center gap-2 text-center px-4'>
          <p className='text-sm text-red-600 font-medium'>{sdkError}</p>
        </div>
      </div>
    )
  }

  if (!docToken || !authData) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-white'>
        <div className='flex flex-col items-center gap-2 text-center px-4'>
        <p className='text-sm text-black/60'>无法加载文档</p>
          {!docToken && <p className='text-xs text-black/40 mt-1'>文档 URL 格式不正确</p>}
          {!authData && <p className='text-xs text-black/40 mt-1'>鉴权信息未获取到</p>}
        </div>
      </div>
    )
  }

  // 使用 DocComponentSdk 构造函数创建组件
  // 根据飞书官方文档：https://open.larkoffice.com/document/common-capabilities/web-components/uYDO3YjL2gzN24iN3cjN/introduction
  // 注意：需要给文档设置一个固定高度，否则会全量加载文档，有性能问题
  return (
    <div 
      ref={containerRef}
      className={className} 
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
    >
      <div 
        id='loading' 
        className='absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm'
      >
        <div className='flex flex-col items-center justify-center gap-3'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
          <p className='text-sm text-black/60 text-center'>加载中...</p>
        </div>
      </div>
      {/* 组件将通过 DocComponentSdk 构造函数动态渲染到这个容器中 */}
    </div>
  )
}
