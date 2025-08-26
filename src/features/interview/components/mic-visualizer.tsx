'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MicVisualizerProps {
  stream: MediaStream | null | undefined
  className?: string
  barCount?: number // default 12 for capsule design
}

export function MicVisualizer({ stream, className, barCount = 12 }: MicVisualizerProps) {
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
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8
        analyserRef.current = analyser
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const tick = () => {
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length
          const ratio = Math.max(0, Math.min(1, avg / 255))
          const lit = Math.max(0, Math.min(barCount, Math.round(ratio * barCount)))
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
  }, [stream, barCount])

  return (
    <div className={cn('flex items-center gap-2 h-6', className)}>
      {Array.from({ length: barCount }).map((_, idx) => {
        const lit = idx < activeCount
        return (
          <div
            key={idx}
            className={cn(
              'h-8 w-4 rounded-full transition-colors duration-100',
              lit ? 'bg-primary' : 'bg-primary/30'
            )}
          />
        )
      })}
    </div>
  )
}


