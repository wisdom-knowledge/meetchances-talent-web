'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DeviceTestStatus } from '@/types/device'
import { Button } from '@/components/ui/button'
import Lottie from 'lottie-react'

type DeviceStage = 'headphone' | 'mic' | 'camera'

interface LocalCameraPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  onStatusChange?: (status: DeviceTestStatus) => void
  deviceId?: string | null
  stage?: DeviceStage
  onHeadphoneConfirm?: () => void
  testAudioDurationMs?: number
}

export function LocalCameraPreview({
  className,
  onStatusChange,
  deviceId,
  stage = 'headphone',
  onHeadphoneConfirm,
  testAudioDurationMs = 5500,
  ...props
}: LocalCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false)
  const [lottieData, setLottieData] = useState<object | null>(null)

  const shouldShowHeadphoneUI = stage === 'headphone'
  const lottieUrl = useMemo(
    () => 'https://dnu-cdn.xpertiise.com/common/0601997c-a415-41e3-ac07-680f610f417c.json',
    []
  )
  const audioUrl = useMemo(
    () => 'https://dnu-cdn.xpertiise.com/common/ce52ea1e-9efd-4600-8622-598209aca073.mp3',
    []
  )

  useEffect(() => {
    const start = async () => {
      try {
        onStatusChange?.(DeviceTestStatus.Testing)
        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        }
        const s = await navigator.mediaDevices.getUserMedia(constraints)
        setStream((prev) => {
          prev?.getTracks().forEach((t) => t.stop())
          return s
        })
        if (videoRef.current) {
          ;(videoRef.current as HTMLVideoElement).srcObject = s
          await (videoRef.current as HTMLVideoElement).play().catch(() => undefined)
        }
        onStatusChange?.(DeviceTestStatus.Success)
      } catch (_e) {
        onStatusChange?.(DeviceTestStatus.Failed)
      }
    }
    void start()
    return () => {
      const prev = stream
      prev?.getTracks().forEach((t) => t.stop())
      setStream(null)
      onStatusChange?.(DeviceTestStatus.Idle)
      // stop audio test if any
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
      try {
        audioRef.current?.pause()
      } catch (_e) {
        void _e
      }
      if (audioRef.current) {
        audioRef.current.src = ''
      }
      audioRef.current = null
      setIsPlayingTestAudio(false)
    }
    // only re-run when deviceId changes to avoid flicker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  // Prefetch lottie animation when we are in headphone stage
  useEffect(() => {
    let aborted = false
    const load = async () => {
      if (!shouldShowHeadphoneUI || lottieData) return
      try {
        const res = await fetch(lottieUrl)
        if (!res.ok) return
        const json = (await res.json()) as object
        if (!aborted) setLottieData(json)
      } catch {
        // ignore
      }
    }
    void load()
    return () => {
      aborted = true
    }
  }, [shouldShowHeadphoneUI, lottieData, lottieUrl])

  const handlePlayTestAudio = async () => {
    try {
      // clear previous timer
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }

      // lazy init audio element
      if (!audioRef.current) {
        const audio = new Audio(audioUrl)
        audio.preload = 'auto'
        audio.crossOrigin = 'anonymous'
        audio.loop = false
        audio.onended = () => setIsPlayingTestAudio(false)
        audio.onerror = () => setIsPlayingTestAudio(false)
        audioRef.current = audio
      }

      const audio = audioRef.current
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (_e) {
        void _e
      }

      setIsPlayingTestAudio(true)
      await audio.play().catch(() => undefined)

      // optional forced stop after duration
      if (testAudioDurationMs > 0) {
        stopTimerRef.current = window.setTimeout(() => {
          try {
            audio.pause()
          } catch (_err) {
            void _err
          }
          setIsPlayingTestAudio(false)
        }, Math.max(500, testAudioDurationMs))
      }
    } catch (_e) {
      void _e
      setIsPlayingTestAudio(false)
    }
  }

  return (
    <div className={className} {...props}>
      <Card className='overflow-hidden py-0'>
        <div className={cn('relative bg-black aspect-video')}>
          <video ref={videoRef} playsInline muted className='h-full w-full object-cover' />

          {/* Headphone stage overlay */}
          {shouldShowHeadphoneUI ? (
            <>
              {/* Lottie animations at both sides while audio is playing */}
              {isPlayingTestAudio && lottieData ? (
                <>
                  {/* Left */}
                  <div className='pointer-events-none absolute inset-y-0 -left-12 flex items-center'>
                    <Lottie animationData={lottieData} loop autoplay className='h-48 w-48' />
                  </div>
                  {/* Right (mirrored) */}
                  <div className='pointer-events-none absolute inset-y-0 -right-12 flex items-center'>
                    <div className='-scale-x-100'>
                      <Lottie animationData={lottieData} loop autoplay className='h-48 w-48' />
                    </div>
                  </div>
                </>
              ) : null}

              {/* Bottom controls */}
              <div className='absolute inset-x-0 bottom-3 flex items-center justify-center gap-3 px-4'>
                <Button size='sm' onClick={handlePlayTestAudio} disabled={isPlayingTestAudio}>
                  播放测试音频
                </Button>
                <Button size='sm' variant='secondary' onClick={onHeadphoneConfirm}>
                  我能听到
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  )
}


