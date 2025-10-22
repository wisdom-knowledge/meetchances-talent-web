import type { ToOptions } from '@tanstack/react-router'
import { getRouterInstance } from '@/lib/router-ref'
import { detectRuntimeEnvSync } from '@/lib/env'

type NavigateInput = ToOptions

function toMiniProgramUrl(to: string, search?: Record<string, unknown>) {
  const hasQuery = to.includes('?')
  const query = new URLSearchParams()
  if (search) {
    Object.entries(search).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      query.set(k, String(v))
    })
  }
  const queryStr = query.toString()
  return hasQuery || !queryStr ? to : `${to}?${queryStr}`
}

export function navigate(options: NavigateInput) {
  const env = detectRuntimeEnvSync()
  const router = getRouterInstance()
  if (!router) throw new Error('Router is not ready yet')

  const wxAny = (typeof window !== 'undefined'
    ? (window as unknown as {
        wx?: { miniProgram?: { navigateTo?: (config: { url: string }) => void } }
      })
    : { wx: undefined }).wx

  if (env === 'wechat-miniprogram' && wxAny?.miniProgram?.navigateTo) {
    const to = (options as unknown as { to: string }).to
    const search = (options as unknown as { search?: Record<string, unknown> }).search
    if (typeof to === 'string') {
      const url = toMiniProgramUrl(to, search)
      wxAny.miniProgram.navigateTo({ url })
      return
    }
  }
  router.navigate(options)
}

export function redirect(options: NavigateInput) {
  const env = detectRuntimeEnvSync()
  const router = getRouterInstance()
  if (!router) throw new Error('Router is not ready yet')

  const wxAny = (typeof window !== 'undefined'
    ? (window as unknown as {
        wx?: { miniProgram?: { redirectTo?: (config: { url: string }) => void } }
      })
    : { wx: undefined }).wx

  if (env === 'wechat-miniprogram' && wxAny?.miniProgram?.redirectTo) {
    const to = (options as unknown as { to: string }).to
    const search = (options as unknown as { search?: Record<string, unknown> }).search
    if (typeof to === 'string') {
      const url = toMiniProgramUrl(to, search)
      wxAny.miniProgram.redirectTo({ url })
      return
    }
  }
  router.navigate({ ...options, replace: true })
}


