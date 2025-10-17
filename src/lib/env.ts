export type RuntimeEnv = 'desktop' | 'mobile' | 'wechat-miniprogram'

const MOBILE_BREAKPOINT = 768

/** 同步判断是否在微信小程序环境（最佳努力，可能不完全准确） */
export function isWeChatMiniProgramSync(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // 方式1：全局标记（微信官方 H5 环境会注入）
    if ((window as unknown as { __wxjs_environment?: string }).__wxjs_environment === 'miniprogram') {
      return true
    }
    // 方式2：UA 标记（按需使用正则匹配）
    const ua = navigator.userAgent
    if (/miniprogram/.test(ua)) return true
  } catch (_e) {
    // ignore
  }
  return false
}

/** 同步判断是否为移动端视口（优先视口宽度，fallback 到 UA） */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
    }
    if (typeof window.innerWidth === 'number') {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    const ua = navigator.userAgent.toLowerCase()
    return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
  } catch (_e) {
    return false
  }
}

/** 同步环境识别：Desktop / Mobile / 微信小程序 */
export function detectRuntimeEnvSync(): RuntimeEnv {
  try {
    if (isWeChatMiniProgramSync()) return 'wechat-miniprogram'
    return isMobileViewport() ? 'mobile' : 'desktop'
  } catch (_e) {
    return 'desktop'
  }
}

/**
 * 异步确认环境（当可用时调用 wx.miniProgram.getEnv 做精确确认）
 * - 若不可用/失败，回退到同步结果
 */
export async function detectRuntimeEnv(): Promise<RuntimeEnv> {
  const syncResult = detectRuntimeEnvSync()
  try {
    if (typeof window === 'undefined') return syncResult
    const wxAny = (window as unknown as { wx?: unknown }).wx as
      | undefined
      | { miniProgram?: { getEnv?: (cb: (res: { miniprogram: boolean }) => void) => void } }
    if (wxAny?.miniProgram?.getEnv) {
      const confirmed = await new Promise<RuntimeEnv>((resolve) => {
        try {
          wxAny.miniProgram!.getEnv!((res: { miniprogram: boolean }) => {
            if (res?.miniprogram) resolve('wechat-miniprogram')
            else resolve(syncResult)
          })
        } catch (_e) {
          resolve(syncResult)
        }
      })
      return confirmed
    }
    return syncResult
  } catch (_e) {
    return syncResult
  }
}


