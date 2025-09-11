'use client'

import { useEffect, useMemo, useState } from 'react'
import { ConnectionQuality, type LocalParticipant } from 'livekit-client'
import { useLocalParticipant } from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function mapQualityToBars(quality: ConnectionQuality | undefined): 0 | 1 | 2 | 3 {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return 3
    case ConnectionQuality.Good:
      return 2
    case ConnectionQuality.Poor:
      return 1
    default:
      return 0
  }
}

export function ConnectionQualityBars({ className, debug }: { className?: string; debug?: boolean }) {
  const { localParticipant } = useLocalParticipant()
  const [bars, setBars] = useState<0 | 1 | 2 | 3>(3)
  const [qualityKnown, setQualityKnown] = useState(false)
  const debugEnabled = useMemo(() => (typeof debug === 'boolean' ? debug : Boolean(import.meta.env.DEV)), [debug])

  useEffect(() => {
    const lp: LocalParticipant | undefined = localParticipant
    if (!lp) return
    const update = () => {
      const q = lp.connectionQuality
      const known = q !== undefined && q !== ConnectionQuality.Unknown
      setQualityKnown(known)
      const next = known ? mapQualityToBars(q) : 3
      setBars(next as 0 | 1 | 2 | 3)
      if (debugEnabled) {
        // 使用 console.error 输出调试信息；在 dev 默认开启
        /* eslint-disable-next-line no-console */
        console.error('[LiveKit] connectionQualityChanged', {
          quality: q,
          bars: next,
          at: new Date().toISOString(),
        })
      }
    }
    // 初始同步一次
    update()
    const handler = () => update()
    lp.on('connectionQualityChanged', handler)
    return () => {
      try { lp.off('connectionQualityChanged', handler) } catch { /* noop */ }
    }
  }, [localParticipant, debugEnabled])

  // 颜色映射：
  // 3 根：全部绿色；2 根：两黄一灰；1 根：一红两灰；0 根：全部灰
  const colors = [
    'bg-muted', // 灰
    'bg-red-500', // 红
    'bg-yellow-400', // 黄
    'bg-green-500', // 绿
  ] as const

  const barColor = (idx: 1 | 2 | 3): string => {
    if (bars >= 3) return colors[3]
    if (bars === 2) return idx <= 2 ? colors[2] : colors[0]
    if (bars === 1) return idx === 1 ? colors[1] : colors[0]
    return colors[0]
  }

  const barsView = (
    <div className={cn('flex items-end gap-0.5', className)} aria-label='网络状态'>
      <div className={cn('h-2 w-1 rounded-sm', barColor(1))} />
      <div className={cn('h-3 w-1 rounded-sm', barColor(2))} />
      <div className={cn('h-4 w-1 rounded-sm', barColor(3))} />
    </div>
  )

  if (qualityKnown && bars < 3) {
    return (
      <Tooltip open>
        <TooltipTrigger asChild>{barsView}</TooltipTrigger>
        <TooltipContent
          side='top'
          sideOffset={8}
          className='bg-black text-white rounded-full border-0 shadow-none px-3 py-1 pointer-events-none'
          arrowClassName='bg-black/90 fill-black/50 shadow-none translate-y-[calc(-50%_-_0px)]'
        >
          当前网络信号弱
        </TooltipContent>
      </Tooltip>
    )
  }

  return barsView
}

export default ConnectionQualityBars

// 独立版本：无需 LiveKit Room，上线前在非房间环境也可显示网络大致状态
export function ConnectionQualityBarsStandalone({ className, debug }: { className?: string; debug?: boolean }) {
  const [bars, setBars] = useState<0 | 1 | 2 | 3>(3)
  const [qualityKnown, setQualityKnown] = useState(false)
  const debugEnabled = useMemo(() => (typeof debug === 'boolean' ? debug : Boolean(import.meta.env.DEV)), [debug])

  useEffect(() => {
    const updateFromNetworkInfo = () => {
      let next: 0 | 1 | 2 | 3 = 3
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          next = 0
          setQualityKnown(true)
        } else {
          // Network Information API（有限支持，Safari 可能不支持）
          const anyNav = navigator as unknown as { connection?: { effectiveType?: string; addEventListener?: (...args: unknown[]) => void; removeEventListener?: (...args: unknown[]) => void } }
          const eff = anyNav.connection?.effectiveType
          if (eff) {
            setQualityKnown(true)
            if (eff === '4g') next = 3
            else if (eff === '3g') next = 2
            else next = 1 // 2g / slow-2g
          } else {
            // 无法判断时，显示为满格但不提示
            setQualityKnown(false)
            next = 3
          }
        }
      } catch {
        setQualityKnown(false)
        next = 3
      }
      setBars(next)
      if (debugEnabled) {
        /* eslint-disable-next-line no-console */
        console.error('[Network] effectiveType update', {
          bars: next,
          online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
          at: new Date().toISOString(),
        })
      }
    }

    updateFromNetworkInfo()
    const anyNav = navigator as unknown as { connection?: { addEventListener?: (type: string, cb: () => void) => void; removeEventListener?: (type: string, cb: () => void) => void } }
    const onConnChange = () => updateFromNetworkInfo()
    const onOnline = () => updateFromNetworkInfo()
    const onOffline = () => updateFromNetworkInfo()
    try { anyNav.connection?.addEventListener?.('change', onConnChange) } catch { /* noop */ }
    try { window.addEventListener('online', onOnline) } catch { /* noop */ }
    try { window.addEventListener('offline', onOffline) } catch { /* noop */ }
    return () => {
      try { anyNav.connection?.removeEventListener?.('change', onConnChange) } catch { /* noop */ }
      try { window.removeEventListener('online', onOnline) } catch { /* noop */ }
      try { window.removeEventListener('offline', onOffline) } catch { /* noop */ }
    }
  }, [debugEnabled])

  const colors = [
    'bg-muted',
    'bg-red-500',
    'bg-yellow-400',
    'bg-green-500',
  ] as const

  const barColor = (idx: 1 | 2 | 3): string => {
    if (bars >= 3) return colors[3]
    if (bars === 2) return idx <= 2 ? colors[2] : colors[0]
    if (bars === 1) return idx === 1 ? colors[1] : colors[0]
    return colors[0]
  }

  const barsView = (
    <div className={cn('flex items-end gap-0.5', className)} aria-label='网络状态'>
      <div className={cn('h-2 w-1 rounded-sm', barColor(1))} />
      <div className={cn('h-3 w-1 rounded-sm', barColor(2))} />
      <div className={cn('h-4 w-1 rounded-sm', barColor(3))} />
    </div>
  )

  if (qualityKnown && bars < 3) {
    return (
      <Tooltip open>
        <TooltipTrigger asChild>{barsView}</TooltipTrigger>
        <TooltipContent
          side='top'
          sideOffset={8}
          className='bg-black text-white rounded-full border-0 shadow-none px-3 py-1 pointer-events-none'
          arrowClassName='bg-black/90 fill-black/50 shadow-none translate-y-[calc(-50%_-_0px)]'
        >
          当前网络信号弱
        </TooltipContent>
      </Tooltip>
    )
  }

  return barsView
}


