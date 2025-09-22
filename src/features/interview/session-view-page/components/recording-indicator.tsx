'use client'

import { useEffect, useRef, useState } from 'react'
import Lottie from 'lottie-react'
import micLottie from '@/lotties/microphone-lottie.json'
import { cn } from '@/lib/utils'

interface RecordingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  listening?: boolean
  stream?: MediaStream | null
}

export default function RecordingIndicator({ listening = true, stream, className, ...props }: RecordingIndicatorProps) {
  const [isRecording, setIsRecording] = useState(false)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!listening) {
      setIsRecording(false)
    }
  }, [listening])

  useEffect(() => {
    let audioContext: AudioContext | undefined
    let analyser: AnalyserNode | undefined
    let microphone: MediaStreamAudioSourceNode | undefined
    let raf = 0

    const start = async () => {
      try {
        const usingStream = stream ?? (await navigator.mediaDevices.getUserMedia({ audio: true, video: false }))
        if (!stream) {
          localStreamRef.current = usingStream
        }

        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.7
        analyser.minDecibels = -70
        analyser.maxDecibels = -10

        const src = audioContext.createMediaStreamSource(usingStream)
        microphone = src
        src.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const hzPerBin = audioContext.sampleRate / 2 / bufferLength
        const startBin = Math.max(0, Math.floor(300 / hzPerBin))
        const endBin = Math.min(bufferLength - 1, Math.ceil(3400 / hzPerBin))

        let ema = 0
        const alpha = 0.85
        const ON_THRESHOLD = 18
        const OFF_THRESHOLD = 12
        let aboveFrames = 0
        let belowFrames = 0

        const tick = () => {
          if (!analyser) return
          analyser.getByteFrequencyData(dataArray)
          let sumSq = 0
          let count = 0
          for (let i = startBin; i <= endBin; i++) {
            const v = dataArray[i]
            sumSq += v * v
            count++
          }
          const bandRms = Math.sqrt(sumSq / Math.max(1, count))
          ema = alpha * ema + (1 - alpha) * bandRms

          if (listening && ema >= ON_THRESHOLD) {
            aboveFrames++
            belowFrames = 0
            if (aboveFrames >= 3) setIsRecording(true)
          } else if (ema <= OFF_THRESHOLD || !listening) {
            belowFrames++
            aboveFrames = 0
            if (belowFrames >= 6) setIsRecording(false)
          }

          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch {
        // ignore
      }
    }

    void start()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      try { microphone?.disconnect() } catch { /* noop */ }
      if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close() } catch { /* noop */ }
      }
      if (!stream) {
        localStreamRef.current?.getTracks().forEach((t) => {
          try { t.stop() } catch { /* noop */ }
        })
        localStreamRef.current = null
      }
    }
  }, [stream, listening])

  return (
    <div className={cn('w-80', className)} {...props}>
      <Lottie animationData={micLottie as unknown as object} loop={isRecording && listening} autoplay={isRecording && listening} className='h-full w-full' />
    </div>
  )
}


