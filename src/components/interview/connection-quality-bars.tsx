'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ConnectionQualityBars({ className, debug }: { className?: string; debug?: boolean }) {
  const [bars, setBars] = useState<0 | 1 | 2 | 3>(3)
  const [qualityKnown, setQualityKnown] = useState(false)
  const debugEnabled = useMemo(() => (typeof debug === 'boolean' ? debug : Boolean(import.meta.env.DEV)), [debug])

  useEffect(() => {
    const updateNetworkStatus = () => {
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
        console.error('[Network] connection quality update', {
          bars: next,
          online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
          effectiveType: (navigator as unknown as { connection?: { effectiveType?: string } })?.connection?.effectiveType,
          at: new Date().toISOString(),
        })
      }
    }

    updateNetworkStatus()
    const anyNav = navigator as unknown as { connection?: { addEventListener?: (type: string, cb: () => void) => void; removeEventListener?: (type: string, cb: () => void) => void } }
    const onConnChange = () => updateNetworkStatus()
    const onOnline = () => updateNetworkStatus()
    const onOffline = () => updateNetworkStatus()
    try { anyNav.connection?.addEventListener?.('change', onConnChange) } catch { /* noop */ }
    try { window.addEventListener('online', onOnline) } catch { /* noop */ }
    try { window.addEventListener('offline', onOffline) } catch { /* noop */ }
    return () => {
      try { anyNav.connection?.removeEventListener?.('change', onConnChange) } catch { /* noop */ }
      try { window.removeEventListener('online', onOnline) } catch { /* noop */ }
      try { window.removeEventListener('offline', onOffline) } catch { /* noop */ }
    }
  }, [debugEnabled])

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

// 为了向后兼容，保留 Standalone 的别名导出
export const ConnectionQualityBarsStandalone = ConnectionQualityBars


