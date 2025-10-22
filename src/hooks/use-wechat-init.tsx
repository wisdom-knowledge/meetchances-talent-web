import { useCallback } from 'react'
import { fetchWeChatSignature } from '../lib/api'

// 微信SDK类型声明
declare global {
  interface Window {
    wx?: {
      config: (config: {
        debug?: boolean
        appId: string
        timestamp: number
        nonceStr: string
        signature: string
        jsApiList: string[]
      }) => void
      ready: (callback: () => void) => void
      error: (callback: (res: { errMsg: string }) => void) => void
      updateTimelineShareData: (config: {
        title: string
        link: string
        imgUrl: string
        success?: () => void
        cancel?: () => void
      }) => void
      updateAppMessageShareData: (config: {
        title: string
        desc: string
        link: string
        imgUrl: string
        success?: () => void
        cancel?: () => void
      }) => void
      // 可以根据需要扩展更多微信API
      miniProgram?: {
        navigateTo?: (config: { url: string }) => void
        redirectTo?: (config: { url: string }) => void
        getEnv?: (cb: (res: { miniprogram: boolean }) => void) => void
      }
    }
  }
}

export interface UseWeChatInitOptions {
  appId?: string
  debug?: boolean
  url?: string
  jsApiList?: string[]
}

/**
 * 微信SDK初始化Hook
 * 提供微信SDK的基础初始化功能，可被其他微信相关Hook复用
 */
export function useWeChatInit(options: UseWeChatInitOptions = {}) {
  const {
    appId = 'wx98c3a9aff6cd772b',
    debug = false,
    url = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '',
    jsApiList = ['updateTimelineShareData', 'updateAppMessageShareData'],
  } = options

  // 检查是否在微信环境
  const isWeChat = useCallback(() => {
    if (typeof window === 'undefined') return false
    const userAgent = navigator.userAgent.toLowerCase()
    return /micromessenger/i.test(userAgent)
  }, [])

  // 检查微信SDK是否已加载
  const isWxSDKLoaded = useCallback(() => {
    return typeof window !== 'undefined' && !!window.wx
  }, [])

  // 初始化微信SDK
  const initWeChatSDK = useCallback(async (
    onReady?: () => void,
    onError?: (error: { errMsg: string }) => void
  ) => {
    // 检查环境
    if (!isWeChat()) {
      return false
    }

    // 检查SDK是否已加载
    if (!isWxSDKLoaded()) {
      return false
    }

    try {
      // 获取微信签名
      const response = await fetchWeChatSignature(url)
      
      if (!response.data) {
        throw new Error(response.status_msg || '获取签名失败')
      }

      const { timestamp, noncestr, signature } = response.data

      // 配置微信SDK
      const wxConfig = {
        debug,
        appId,
        timestamp,
        nonceStr: noncestr,
        signature,
        jsApiList,
      }

      window.wx!.config(wxConfig)

      // 设置回调
      window.wx!.ready(() => {
        onReady?.()
      })

      window.wx!.error((res) => {
        onError?.(res)
      })

      return true
    } catch (error) {
      onError?.({ 
        errMsg: error instanceof Error ? error.message : '未知错误' 
      })
      return false
    }
  }, [appId, debug, url, jsApiList, isWeChat, isWxSDKLoaded])

  return {
    isWeChat: isWeChat(),
    isWxSDKLoaded: isWxSDKLoaded(),
    initWeChatSDK,
  }
}
