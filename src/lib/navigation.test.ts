// @ts-nocheck
/// <reference types="vitest" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appNavigate, navigate, redirect, setNavigationRouter } from './navigation'

// 伪造 routerRef
const fakeRouter = {
  navigate: vi.fn(),
} as unknown as Parameters<typeof setNavigationRouter>[0]

function setWxMiniProgramAvailable() {
  ;(globalThis as unknown as { window: Window }).window ||= (globalThis as unknown as { window: Window }).window
  ;(window as unknown as { wx?: any }).wx = {
    miniProgram: {
      switchTab: vi.fn(),
      redirectTo: vi.fn(),
      navigateTo: vi.fn(),
      getEnv: vi.fn(),
    },
  }
  ;(window as unknown as any).__wxjs_environment = 'miniprogram'
}

function clearWx() {
  if ((window as unknown as { wx?: any }).wx) delete (window as unknown as { wx?: any }).wx
  if ((window as unknown as any).__wxjs_environment) delete (window as unknown as any).__wxjs_environment
}

const originalLocation = window.location

function mockLocation() {
  const hrefSpy = vi.fn()
  const replaceSpy = vi.fn()
  const assignSpy = vi.fn()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      get href() {
        return ''
      },
      set href(v: string) {
        hrefSpy(v)
      },
      assign: assignSpy,
      replace: replaceSpy,
      search: '',
      hostname: 'localhost',
      protocol: 'http:',
    },
  })
  return { hrefSpy, replaceSpy, assignSpy }
}

describe('navigation', () => {
  beforeEach(() => {
    setNavigationRouter(fakeRouter)
  })

  afterEach(() => {
    vi.clearAllMocks()
    clearWx()
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
  })

  it('router navigate (mode=navigate) with query', () => {
    const { hrefSpy, replaceSpy } = mockLocation()
    appNavigate({ to: '/jobs', query: { page: 1, q: 'a b' }, mode: 'navigate', api: 'router' })
    expect(fakeRouter.navigate).toHaveBeenCalledWith({
      to: '/jobs',
      replace: false,
      search: { page: 1, q: 'a b' },
    })
    expect(hrefSpy).not.toHaveBeenCalled()
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it('router redirect (mode=redirect) with query', () => {
    const { replaceSpy } = mockLocation()
    redirect('/home', { from: 'x' })
    expect(fakeRouter.navigate).toHaveBeenCalledWith({
      to: '/home',
      replace: true,
      search: { from: 'x' },
    })
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it('native navigate uses location.href', () => {
    const { hrefSpy } = mockLocation()
    navigate('/mine', { tab: 'a' }, 'native')
    expect(hrefSpy).toHaveBeenCalled()
    const url = hrefSpy.mock.calls[0][0] as string
    expect(url.startsWith('/mine?')).toBe(true)
    expect(url.includes('tab=a')).toBe(true)
  })

  it('native redirect uses location.replace', () => {
    const { replaceSpy } = mockLocation()
    redirect('/mine', { rid: 1 }, 'native')
    expect(replaceSpy).toHaveBeenCalled()
    const url = replaceSpy.mock.calls[0][0] as string
    expect(url.includes('/mine?')).toBe(true)
    expect(url.includes('rid=1')).toBe(true)
  })

  it('miniProgram switchTab for tab pages', () => {
    mockLocation()
    setWxMiniProgramAvailable()
    appNavigate({ to: '/home', mode: 'navigate' })
    const wx = (window as unknown as { wx?: any }).wx!
    expect(wx.miniProgram.switchTab).toHaveBeenCalledWith({ url: '/home' })
    expect(wx.miniProgram.redirectTo).not.toHaveBeenCalled()
    expect(wx.miniProgram.navigateTo).not.toHaveBeenCalled()
  })

  it('miniProgram redirectTo for non-tab with redirect', () => {
    mockLocation()
    setWxMiniProgramAvailable()
    appNavigate({ to: '/interview/prepare', mode: 'redirect', query: { j: 1 } })
    const wx = (window as unknown as { wx?: any }).wx!
    expect(wx.miniProgram.redirectTo).toHaveBeenCalledWith({ url: '/interview/prepare?j=1' })
  })

  it('miniProgram navigateTo for non-tab with navigate', () => {
    mockLocation()
    setWxMiniProgramAvailable()
    appNavigate({ to: '/resume-upload', mode: 'navigate', query: { from: 'x' } })
    const wx = (window as unknown as { wx?: any }).wx!
    expect(wx.miniProgram.navigateTo).toHaveBeenCalledWith({ url: '/resume-upload?from=x' })
  })
})


