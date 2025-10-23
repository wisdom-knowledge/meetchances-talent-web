import { detectRuntimeEnvSync } from '@/lib/env'
import type { RegisteredRouter } from '@tanstack/react-router'

// 统一定义：跳转模式与实现方式
export type JumpMode = 'navigate' | 'redirect'
export type ApiMode = 'router' | 'native'

export interface NavigateOptions {
  to: string
  query?: Record<string, string | number | boolean | null | undefined>
  mode?: JumpMode
  api?: ApiMode
}

// 小程序底部 Tab 路由（命中则必须使用 switchTab）
const MINI_PROGRAM_TABS = new Set(['/home', '/jobs', '/mine', '/mock-interview'])

let routerRef: RegisteredRouter | null = null

export function setNavigationRouter(router: RegisteredRouter): void {
  routerRef = router
}

function buildQueryString(query?: NavigateOptions['query']): string {
  if (!query) return ''
  const entries: Array<[string, string]> = []
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    const value = typeof v === 'boolean' ? String(v) : String(v)
    entries.push([encodeURIComponent(k), encodeURIComponent(value)])
  }
  if (entries.length === 0) return ''
  return `?${entries.map(([k, v]) => `${k}=${v}`).join('&')}`
}

function joinPathAndQuery(to: string, query?: NavigateOptions['query']): string {
  const qs = buildQueryString(query)
  if (!qs) return to
  // 如果 to 已经带有查询串，继续拼接 &
  if (to.includes('?')) return `${to}&${qs.slice(1)}`
  return `${to}${qs}`
}

function navigateInMiniProgram(to: string, mode: JumpMode, query?: NavigateOptions['query']): void {
  const url = joinPathAndQuery(to, query)
  // wx 类型以最佳努力方式访问，避免编译期类型依赖
  const wxAny = (typeof window !== 'undefined' ? (window as unknown as { wx?: unknown }).wx : undefined) as
    | undefined
    | { miniProgram?: { switchTab?: (o: { url: string }) => void; redirectTo?: (o: { url: string }) => void; navigateTo?: (o: { url: string }) => void } }

  const mp = wxAny?.miniProgram
  if (!mp) {
    // 无法调用小程序 API 时，回退为原生方式，避免死路
    if (mode === 'redirect') window.location.replace(url)
    else window.location.href = url
    return
  }

  if (MINI_PROGRAM_TABS.has(to)) {
    mp.switchTab?.({ url })
    return
  }
  if (mode === 'redirect') {
    mp.redirectTo?.({ url })
    return
  }
  mp.navigateTo?.({ url })
}

function navigateWithRouter(to: string, mode: JumpMode, query?: NavigateOptions['query']): void {
  // router.navigate 的 search 类型依赖已注册路由的具体定义，这里作为通用适配层做窄化处理
  if (!routerRef) {
    // 没有注入 router 时回退到原生
    if (mode === 'redirect') window.location.replace(joinPathAndQuery(to, query))
    else window.location.href = joinPathAndQuery(to, query)
    return
  }
  routerRef.navigate({
    to,
    replace: mode === 'redirect',
    // 通过字符串化后交由路由解析，避免类型耦合；此处维持轻度类型断言，避免使用 any
    search: (query ?? {}) as unknown as never,
  })
}

function navigateWithNative(to: string, mode: JumpMode, query?: NavigateOptions['query']): void {
  const url = joinPathAndQuery(to, query)
  if (mode === 'redirect') {
    window.location.replace(url)
    return
  }
  window.location.href = url
}

/**
 * 统一导航方法：支持 mode(navigate|redirect)、api(router|native)、小程序环境自动分流
 */
export function appNavigate(options: NavigateOptions): void {
  const { to, query, mode = 'navigate', api = 'router' } = options
  const env = detectRuntimeEnvSync()

  if (env === 'wechat-miniprogram') {
    navigateInMiniProgram(to, mode, query)
    return
  }

  if (api === 'router') {
    navigateWithRouter(to, mode, query)
    return
  }
  navigateWithNative(to, mode, query)
}

// 便捷封装
export function redirect(to: string, query?: NavigateOptions['query'], api: ApiMode = 'router'): void {
  appNavigate({ to, query, mode: 'redirect', api })
}

export function navigate(to: string, query?: NavigateOptions['query'], api: ApiMode = 'router'): void {
  appNavigate({ to, query, mode: 'navigate', api })
}


