import * as React from 'react'
import { detectRuntimeEnvSync, detectRuntimeEnv, type RuntimeEnv } from '@/lib/env'

/**
 * 运行环境 Hook：实时返回 'desktop' | 'mobile' | 'wechat-miniprogram'
 * - 首次同步判断，随后尝试异步精确确认（若可用）
 * - 监听窗口尺寸变化以动态更新 desktop/mobile 判定
 */
export function useRuntimeEnv() {
  const [env, setEnv] = React.useState<RuntimeEnv>(() => detectRuntimeEnvSync())

  React.useEffect(() => {
    let disposed = false

    const updateSync = () => {
      const next = detectRuntimeEnvSync()
      if (!disposed) setEnv(next)
    }

    // 先做一次同步更新，保证首屏正确
    updateSync()

    // 异步精确确认（若可用）
    detectRuntimeEnv().then((confirmed) => {
      if (!disposed) setEnv(confirmed)
    })

    // 监听窗口尺寸变化，保持 desktop/mobile 的实时性
    const onResize = () => updateSync()
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return env
}


