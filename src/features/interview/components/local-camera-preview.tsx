'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DeviceTestStatus } from '@/types/device'
import { Button } from '@/components/ui/button'
import { IconPlayerRecordFilled, IconPlayerPlayFilled, IconPlayerPauseFilled } from '@tabler/icons-react'
import Lottie from 'lottie-react'
import { MicVisualizer } from '@/features/interview/components/mic-visualizer'
import { motion } from 'framer-motion'

type DeviceStage = 'headphone' | 'mic' | 'camera'

interface LocalCameraPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  onStatusChange?: (status: DeviceTestStatus) => void
  deviceId?: string | null
  stage?: DeviceStage
  onHeadphoneConfirm?: () => void
  testAudioDurationMs?: number
  onCameraDeviceResolved?: (deviceId: string | null) => void
  onCameraConfirmed?: () => void
  onMicConfirmed?: () => void
  disableHeadphoneActions?: boolean
  disableCameraConfirm?: boolean
}

export function LocalCameraPreview({
  className,
  onStatusChange,
  deviceId,
  stage = 'camera',
  onHeadphoneConfirm,
  testAudioDurationMs = 5500,
  onCameraDeviceResolved,
  onCameraConfirmed,
  onMicConfirmed,
  disableHeadphoneActions = false,
  disableCameraConfirm = true,
  ...props
}: LocalCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false)
  const [lottieData, setLottieData] = useState<object | null>(null)

  const shouldShowHeadphoneUI = stage === 'headphone'
  const shouldShowMicUI = stage === 'mic'
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
        // Robust constraints with fallbacks to avoid OverconstrainedError
        const attempts: MediaStreamConstraints[] = []
        if (deviceId) {
          attempts.push({ video: { deviceId: { exact: deviceId } }, audio: false })
          attempts.push({ video: { deviceId }, audio: false })
        }
        attempts.push({ video: { facingMode: 'user' }, audio: false })
        attempts.push({ video: true, audio: false })

        let s: MediaStream | null = null
        let lastErr: unknown = null
        for (const cs of attempts) {
          try {
            s = await navigator.mediaDevices.getUserMedia(cs)
            if (s) break
          } catch (e) {
            lastErr = e
            continue
          }
        }
        if (!s) throw lastErr ?? new Error('getUserMedia failed')
        setStream((prev) => {
          prev?.getTracks().forEach((t) => t.stop())
          return s
        })
        if (videoRef.current) {
          ;(videoRef.current as HTMLVideoElement).srcObject = s
          await (videoRef.current as HTMLVideoElement).play().catch(() => undefined)
        }
        try {
          const track = s.getVideoTracks()[0]
          const settings = track?.getSettings?.()
          const resolvedId = (settings && 'deviceId' in settings ? (settings.deviceId as string) : null) ?? null
          onCameraDeviceResolved?.(resolvedId)
        } catch {
          // ignore
        }
        // onStatusChange?.(DeviceTestStatus.Success)
      } catch (_e) {
        // eslint-disable-next-line no-console
        console.error('getUserMedia error', _e)
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

  const handleHeadphoneConfirmClick = () => {
    // stop test audio immediately if playing
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    } catch {
      // ignore
    }
    setIsPlayingTestAudio(false)
    onHeadphoneConfirm?.()
  }

  // ---------- Mic stage: capture mic, visualize, 5s record & playback ----------
  const micStreamRef = useRef<MediaStream | null>(null)
  const micRecorderRef = useRef<MediaRecorder | null>(null)
  const micChunksRef = useRef<Blob[]>([])
  const micPlaybackAudioRef = useRef<HTMLAudioElement | null>(null)
  const micStopRecordTimerRef = useRef<number | null>(null)
  const micCountdownTimerRef = useRef<number | null>(null)
  const [micMode, setMicMode] = useState<'recording' | 'playback'>('recording')
  const [countdown, setCountdown] = useState<number>(5)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState<number>(0)
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false)
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState<boolean>(false)
  const PROGRESS_WIDTH_CLASSES = useMemo(
    () => [
      'w-[0%]','w-[2%]','w-[4%]','w-[6%]','w-[8%]','w-[10%]','w-[12%]','w-[14%]','w-[16%]','w-[18%]',
      'w-[20%]','w-[22%]','w-[24%]','w-[26%]','w-[28%]','w-[30%]','w-[32%]','w-[34%]','w-[36%]','w-[38%]',
      'w-[40%]','w-[42%]','w-[44%]','w-[46%]','w-[48%]','w-[50%]','w-[52%]','w-[54%]','w-[56%]','w-[58%]',
      'w-[60%]','w-[62%]','w-[64%]','w-[66%]','w-[68%]','w-[70%]','w-[72%]','w-[74%]','w-[76%]','w-[78%]',
      'w-[80%]','w-[82%]','w-[84%]','w-[86%]','w-[88%]','w-[90%]','w-[92%]','w-[94%]','w-[96%]','w-[98%]','w-[100%]'
    ],
    []
  )
  const progressWidthClass = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, Math.round(playbackProgress)))
    const idx = Math.min(PROGRESS_WIDTH_CLASSES.length - 1, Math.max(0, Math.round(clamped / 2)))
    return PROGRESS_WIDTH_CLASSES[idx]
  }, [playbackProgress, PROGRESS_WIDTH_CLASSES])

  useEffect(() => {
    if (!shouldShowMicUI || micMode !== 'recording') return

    let isCancelled = false

    const initMic = async () => {
      try {
        // Request mic stream
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        if (isCancelled) return
        setMicPermissionDenied(false)
        micStreamRef.current = micStream

        // Setup recorder: record 5s then playback
        micChunksRef.current = []
        const recorder = new MediaRecorder(micStream)
        micRecorderRef.current = recorder
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) micChunksRef.current.push(e.data)
        }
        recorder.onstop = () => {
          try {
            const blob = new Blob(micChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
            const url = URL.createObjectURL(blob)
            setPlaybackUrl(url)
            setMicMode('playback')
          } catch {
            // ignore
          }
        }
        recorder.start()
        // countdown + stop after 5s
        setCountdown(5)
        micCountdownTimerRef.current = window.setInterval(() => {
          setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        micStopRecordTimerRef.current = window.setTimeout(() => {
          try {
            if (recorder.state !== 'inactive') recorder.stop()
          } catch {
            // ignore
          }
        }, 5000)
      } catch {
        setMicPermissionDenied(true)
      }
    }
    void initMic()

    return () => {
      isCancelled = true
      if (micStopRecordTimerRef.current) {
        window.clearTimeout(micStopRecordTimerRef.current)
        micStopRecordTimerRef.current = null
      }
      if (micCountdownTimerRef.current) {
        window.clearInterval(micCountdownTimerRef.current)
        micCountdownTimerRef.current = null
      }
      try {
        if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
          micRecorderRef.current.stop()
        }
      } catch {
        // ignore
      }
      micRecorderRef.current = null
      micChunksRef.current = []
      const micStream = micStreamRef.current
      micStream?.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
      if (micPlaybackAudioRef.current) {
        try {
          micPlaybackAudioRef.current.pause()
        } catch {
          // ignore
        }
        micPlaybackAudioRef.current = null
      }
    }
  }, [shouldShowMicUI, micMode])

  // setup playback audio and track progress (don't autoplay)
  useEffect(() => {
    if (!shouldShowMicUI || micMode !== 'playback' || !playbackUrl) return
    const audio = new Audio(playbackUrl)
    micPlaybackAudioRef.current = audio
    const onTime = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return
      const pct = Math.max(0, Math.min(100, (audio.currentTime / audio.duration) * 100))
      setPlaybackProgress(pct)
    }
    const onEnded = () => {
      setPlaybackProgress(100)
      setIsPlaybackPlaying(false)
    }
    const onPlay = () => {
      setIsPlaybackPlaying(true)
    }
    const onPause = () => {
      setIsPlaybackPlaying(false)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    
    // Auto-play the first time
    void audio.play().catch(() => undefined)
    
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      try {
        audio.pause()
      } catch {
        // ignore
      }
      setIsPlaybackPlaying(false)
      micPlaybackAudioRef.current = null
      // keep playbackUrl for replays until retake
    }
  }, [shouldShowMicUI, micMode, playbackUrl])

  const handlePlaybackToggle = () => {
    const audio = micPlaybackAudioRef.current
    if (!audio) return
    
    try {
      if (isPlaybackPlaying) {
        audio.pause()
      } else {
        // If audio ended, restart from beginning
        if (audio.ended) {
          audio.currentTime = 0
          setPlaybackProgress(0)
        }
        void audio.play().catch(() => undefined)
      }
    } catch {
      // ignore
    }
  }

  const handleMicConfirmed = () => {
    // Restart playback when confirming
    const audio = micPlaybackAudioRef.current
    if (audio) {
      try {
        audio.currentTime = 0
        setPlaybackProgress(0)
        void audio.play().catch(() => undefined)
      } catch {
        // ignore
      }
    }
    onMicConfirmed?.()
  }

  const handleRetake = () => {
    // cleanup playback
    if (micPlaybackAudioRef.current) {
      try {
        micPlaybackAudioRef.current.pause()
      } catch {
        // ignore
      }
      micPlaybackAudioRef.current = null
    }
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl)
      setPlaybackUrl(null)
    }
    setPlaybackProgress(0)
    setIsPlaybackPlaying(false)
    setMicMode('recording')
  }

  return (
    <div className={className} {...props}>
      <Card className='overflow-hidden py-0'>
        <div className={cn('relative bg-black aspect-video w-full max-w-[720px] mx-auto')}>
          <video
            ref={videoRef}
            playsInline
            muted
            className='h-full w-full object-cover'
            controls={false}
            controlsList='nodownload noplaybackrate noremoteplayback'
            disablePictureInPicture
          />

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
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className='absolute inset-x-0 bottom-3 flex items-center justify-center gap-3 px-4'
              >
                <Button size='sm' onClick={handlePlayTestAudio} disabled={disableHeadphoneActions || isPlayingTestAudio}>
                  播放测试音频
                </Button>
                <Button size='sm' variant='secondary' onClick={handleHeadphoneConfirmClick} disabled={disableHeadphoneActions}>
                  我能听到
                </Button>
              </motion.div>
            </>
          ) : null}

          {/* Mic stage overlay */}
          {shouldShowMicUI ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className='absolute inset-x-0 bottom-0 h-[120px] backdrop-blur-md bg-background/40 border-border'
            >
              <div className='h-full w-full px-6 py-4 flex flex-col items-center justify-center gap-3'>
                {/* Title */}
                <div className='text-base text-white'>
                  {micPermissionDenied
                    ? '请选择麦克风设备'
                    : micMode === 'recording'
                      ? '请对麦克风说：我准备好了'
                      : '请确认音质正常'}
                </div>

                {/* Recording Row or Playback Row */}
                {micPermissionDenied ? (
                  <div className='w-full flex items-center justify-center gap-2'>
                    {/* 当未授权时，不展示录制与确认控件，交互在父层被禁用 */}
                  </div>
                ) : micMode === 'recording' ? (
                  <div className='w-full flex items-center justify-center gap-2'>
                    <div className='flex items-center gap-3'>
                      <IconPlayerRecordFilled className='h-5 w-5 text-red-500' />
                      <MicVisualizer stream={micStreamRef.current} />
                    </div>
                    <div className='text-white tabular-nums w-[60px] text-right'>
                      00:0{Math.max(0, Math.min(5, countdown)).toString()}
                    </div>
                  </div>
                ) : (
                  <div className='w-full flex items-center justify-center gap-2'>
                    <div className='flex items-center gap-3'>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-8 w-8 p-0 hover:bg-white/20'
                        onClick={handlePlaybackToggle}
                      >
                        {isPlaybackPlaying ? (
                          <IconPlayerPauseFilled className='h-5 w-5 text-white' />
                        ) : (
                          <IconPlayerPlayFilled className='h-5 w-5 text-white' />
                        )}
                      </Button>
                      <div className='relative h-2 w-[320px] rounded-full bg-primary/20 overflow-hidden'>
                        <div className={cn('absolute left-0 top-0 h-2 rounded-full bg-primary', progressWidthClass)} />
                      </div>
                    </div>
                    <Button size='sm' variant='secondary' onClick={handleRetake}>重录</Button>
                    <Button size='sm' variant='default' onClick={handleMicConfirmed}>确认音质正常</Button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}

          {/* Camera stage simple action */}
          {stage === 'camera' ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className='absolute inset-x-0 bottom-3 flex items-center justify-center'
            >
              <Button size='sm' variant='default' onClick={onCameraConfirmed} disabled={disableCameraConfirm}>确认摄像头状态正常</Button>
            </motion.div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}


