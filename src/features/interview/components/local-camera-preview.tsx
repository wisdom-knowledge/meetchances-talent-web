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
import { useCameraStatusDetection } from '@/hooks/use-camera-status-detection'
import { setAudioSinkId } from '@/lib/devices'
import { useIsMobile } from '@/hooks/use-mobile'
import { reportAudioRecordingInfo } from '@/lib/apm'

type DeviceStage = 'headphone' | 'mic' | 'camera'
type PreparationStep = 'camera' | 'audio' | 'audioQuality' | 'final'

interface LocalCameraPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  onStatusChange?: (status: DeviceTestStatus) => void
  deviceId?: string | null
  speakerDeviceId?: string
  micDeviceId?: string
  stage?: DeviceStage
  onHeadphoneConfirm?: () => void
  testAudioDurationMs?: number
  onCameraDeviceResolved?: (deviceId: string | null) => void
  onCameraConfirmed?: () => void
  onMicConfirmed?: () => void
  disableCameraConfirm?: boolean
  preparationStep?: PreparationStep
  audioConfirmed?: boolean
  onReplayAudio?: () => void
  onHasIssueChange?: (hasIssue: boolean) => void
  // 当该信号递增时，在“耳机”阶段触发播放测试音频
  playTestAudioSignal?: number
  // 麦克风录音完成的回调（从 recording 切换到 playback 时触发）
  onMicRecordComplete?: () => void
  // 外部触发重新录制麦克风
  retakeMicSignal?: number
  // 测试音频播放状态变更
  onTestAudioPlayingChange?: (playing: boolean) => void
  // 麦克风是否处于录制状态
  onMicRecordingChange?: (recording: boolean) => void
}

export function LocalCameraPreview({
  className,
  onStatusChange,
  deviceId,
  speakerDeviceId,
  micDeviceId,
  stage = 'camera',
  onHeadphoneConfirm,
  testAudioDurationMs = 5500,
  onCameraDeviceResolved,
  onCameraConfirmed,
  onMicConfirmed,
  disableCameraConfirm: _disableCameraConfirm = true,
  preparationStep = 'camera',
  audioConfirmed: _audioConfirmed = false,
  onReplayAudio: _onReplayAudio,
  onHasIssueChange,
  playTestAudioSignal,
  retakeMicSignal,
  onTestAudioPlayingChange,
  onMicRecordingChange,
  ...props
}: LocalCameraPreviewProps) {
  const isMobile = useIsMobile()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false)
  const [lottieData, setLottieData] = useState<object | null>(null)

  // 使用优化的摄像头状态检测 hook
  const { hasIssue, startDetection, stopDetection } = useCameraStatusDetection(videoRef, streamRef, {
    enabled: stage === 'camera',
    useCanvasDetection: true, // 启用 Canvas 检测，确保能检测到黑屏
    checkInterval: 200, // 进一步提高检测频率，快速响应
    brightnessThreshold: 20 // 进一步提高亮度阈值，减少误判
  })

  // 当检测状态变化时，通知父组件更新摄像头状态
  useEffect(() => {
    if (stage === 'camera') {
      if (hasIssue) {
        onStatusChange?.(DeviceTestStatus.Failed) // 有问题时设为失败，禁用按钮
      } else {
        onStatusChange?.(DeviceTestStatus.Testing) // 检测通过时设为测试中，允许用户确认
      }
      // 通知父组件 hasIssue 状态变化
      onHasIssueChange?.(hasIssue)
    }
  }, [hasIssue, stage, onStatusChange, onHasIssueChange])

  // 当扬声器设备切换时，更新现有音频元素的sinkId
  useEffect(() => {
    const updateAudioSinkId = async () => {
      if (!speakerDeviceId) return

      // 更新扬声器测试音频的播放设备
      if (audioRef.current) {
        await setAudioSinkId(audioRef.current, speakerDeviceId)
      }

      // 更新麦克风回放音频的播放设备
      if (micPlaybackAudioRef.current) {
        await setAudioSinkId(micPlaybackAudioRef.current, speakerDeviceId)
      }
    }

    void updateAudioSinkId()
  }, [speakerDeviceId])

  const shouldShowHeadphoneUI = stage === 'headphone' && preparationStep === 'audio'
  const shouldShowMicUI = stage === 'mic' && (preparationStep === 'audio' || preparationStep === 'audioQuality')
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
          streamRef.current = s // 同时更新 ref
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
      streamRef.current = null // 同时清理 ref
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

  // 管理黑屏检测的启动和停止
  useEffect(() => {
    if (stage === 'camera' && stream) {
      startDetection()
    } else {
      stopDetection()
    }
  }, [stage, stream, startDetection, stopDetection])

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
        
        // 设置音频播放设备
        if (speakerDeviceId) {
          void setAudioSinkId(audio, speakerDeviceId)
        }
      }

      const audio = audioRef.current
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (_e) {
        void _e
      }

      setIsPlayingTestAudio(true)
      try {
        onTestAudioPlayingChange?.(true)
      } catch (e) {
        void e
      }
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
          try {
            onTestAudioPlayingChange?.(false)
          } catch (e) {
            void e
          }
        }, Math.max(500, testAudioDurationMs))
      }
    } catch (_e) {
      void _e
      setIsPlayingTestAudio(false)
      try {
        onTestAudioPlayingChange?.(false)
      } catch (e) {
        void e
      }
    }
  }

  // 外部触发测试音频播放：当信号变化且处于耳机阶段时执行
  useEffect(() => {
    if (!shouldShowHeadphoneUI) return
    if (!playTestAudioSignal) return
    void handlePlayTestAudio()
    // 仅在数值变化时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playTestAudioSignal, shouldShowHeadphoneUI])

  // 外部触发重录（在展示麦克风 UI 时才响应）
  useEffect(() => {
    if (!shouldShowMicUI) return
    if (!retakeMicSignal) return
    handleRetake()
    // 仅在数值变化时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retakeMicSignal, shouldShowMicUI])

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
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
        
        // 如果指定了麦克风设备ID，则使用该设备
        if (micDeviceId && micDeviceId !== 'default') {
          audioConstraints.deviceId = { exact: micDeviceId }
        }
        
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false,
        })
        reportAudioRecordingInfo({
          msg: '麦克风权限设置成功',
          isCancelled,
          micStream: String(micStream),
        })
        if (isCancelled) return
        setMicPermissionDenied(false)
        micStreamRef.current = micStream

        // Setup recorder: record 5s then playback
        micChunksRef.current = []
        const recorder = new MediaRecorder(micStream)
        micRecorderRef.current = recorder
        try {
          onMicRecordingChange?.(true)
        } catch (e) {
          void e
        }
        recorder.ondataavailable = (e) => {
          reportAudioRecordingInfo({
            msg: '麦克风录制数据',
            size: e.data.size,
            type: recorder.mimeType || 'audio/webm',
          })
          if (e.data && e.data.size > 0) micChunksRef.current.push(e.data)
        }
        recorder.onstop = () => {
          try {
            const blob = new Blob(micChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
            const url = URL.createObjectURL(blob)
            setPlaybackUrl(url)
            setMicMode('playback')
            // 通知父组件录音已完成
            try {
              props.onMicRecordComplete?.()
              reportAudioRecordingInfo({
                msg: '麦克风录制成功',
                url
              })
            } catch (e) {
              reportAudioRecordingInfo({
                msg: '麦克风录制失败',
                error: String(e),
              })
            }
            try {
              onMicRecordingChange?.(false)
            } catch (e) {
              void e
            }
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
          } catch (e) {
            reportAudioRecordingInfo({
              msg: '麦克风状态问题',
              error: String(e),
            })
          }
        }, 5000)
        // throw new Error('test')
      } catch (e) {
        reportAudioRecordingInfo({
          msg: '麦克风权限设置失败',
          error: String(e),
        })
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
      try {
        onMicRecordingChange?.(false)
      } catch (e) {
        void e
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
  }, [shouldShowMicUI, micMode, micDeviceId])

  // setup playback audio and track progress (don't autoplay)
  useEffect(() => {
    if (!shouldShowMicUI || micMode !== 'playback' || !playbackUrl) return
    const audio = new Audio(playbackUrl)
    micPlaybackAudioRef.current = audio
    
    // 设置音频播放设备
    if (speakerDeviceId) {
      void setAudioSinkId(audio, speakerDeviceId)
    }
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
  }, [shouldShowMicUI, micMode, playbackUrl, speakerDeviceId])

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
                  <div className='pointer-events-none absolute inset-y-0 left-[-73px] flex items-center'>
                    <Lottie animationData={lottieData} loop autoplay className=' h-[240px] w-[240px]' />
                  </div>
                  {/* Right (mirrored) */}
                  <div className='pointer-events-none absolute inset-y-0 right-[-73px] flex items-center'>
                    <div className='-scale-x-100'>
                      <Lottie animationData={lottieData} loop autoplay className=' h-[240px] w-[240px]' />
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          {/* Mic stage overlay */}
          {shouldShowMicUI ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className='absolute inset-x-0 bottom-0 h-[120px] backdrop-blur-md border-border'
              style={{ backgroundColor: 'rgba(78, 2, 228, 0.2)' }}
            >
              <div className='h-full w-full px-6 py-4 flex flex-col items-center justify-center gap-3'>
                {/* Title */}
                <div className='text-base text-white'>
                  {micPermissionDenied
                    ? isMobile ? '请授权麦克风权限' : '请选择麦克风设备'
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
                  <div className='w-full flex flex-col sm:flex-row items-center justify-center gap-2'>
                    <div className='flex items-center gap-2 sm:gap-3 w-full sm:w-auto'>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-8 w-8 p-0 hover:bg-white/20 shrink-0'
                        onClick={handlePlaybackToggle}
                      >
                        {isPlaybackPlaying ? (
                          <IconPlayerPauseFilled className='h-5 w-5 text-white' />
                        ) : (
                          <IconPlayerPlayFilled className='h-5 w-5 text-white' />
                        )}
                      </Button>
                      <div className='relative h-2 w-full sm:w-[280px] md:w-[320px] rounded-full bg-primary/20 overflow-hidden'>
                        <div className={cn('absolute left-0 top-0 h-2 rounded-full bg-primary', progressWidthClass)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}


