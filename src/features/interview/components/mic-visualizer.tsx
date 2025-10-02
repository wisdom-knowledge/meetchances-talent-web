'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface MicVisualizerProps {
  stream: MediaStream | null | undefined
  className?: string
  barCount?: number // default 12 for capsule design
}

export function MicVisualizer({ stream, className, barCount }: MicVisualizerProps) {
  const isMobile = useIsMobile()
  // 移动端减少条形数量，从 12 减少到 8
  const finalBarCount = barCount ?? (isMobile ? 8 : 12)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)

  const [activeCount, setActiveCount] = useState<number>(0)

  useEffect(() => {
    if (!stream) return

    let isCancelled = false

    const run = async () => {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        audioContextRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512 // 增加 FFT 大小以提高频率分辨率
        analyser.smoothingTimeConstant = 0.3 // 降低平滑常数以提高响应速度
        analyser.minDecibels = -90 // 设置更低的最小分贝值以提高敏感度
        analyser.maxDecibels = -10 // 设置最大分贝值
        analyserRef.current = analyser
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const tick = () => {
          analyser.getByteFrequencyData(dataArray)
          // 使用 RMS (Root Mean Square) 计算更准确的音量
          const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length)
          // 应用对数缩放和敏感度调整
          const normalizedRms = Math.min(1, rms / 128) // 降低归一化阈值
          const amplified = Math.pow(normalizedRms, 0.5) // 使用幂函数放大小信号
          const lit = Math.max(0, Math.min(finalBarCount, Math.round(amplified * finalBarCount * 1.2))) // 增加放大系数
          if (!isCancelled) setActiveCount(lit)
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {
        // ignore
      }
    }

    void run()
    return () => {
      isCancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          void audioContextRef.current.close().catch(() => undefined)
        }
      } catch {
        // ignore
      }
      audioContextRef.current = null
      if (analyserRef.current) analyserRef.current.disconnect()
      analyserRef.current = null
    }
  }, [stream, finalBarCount])

  return (
    <div className={cn('flex items-center h-6', isMobile ? 'gap-1.5' : 'gap-2', className)}>
      {Array.from({ length: finalBarCount }).map((_, idx) => {
        const lit = idx < activeCount
        return (
          <div
            key={idx}
            className={cn(
              'h-8 rounded-full transition-colors duration-100',
              isMobile ? 'w-3' : 'w-4',
              lit ? 'bg-primary' : 'bg-primary/30'
            )}
          />
        )
      })}
    </div>
  )
}


