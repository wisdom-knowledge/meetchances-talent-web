'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { BarVisualizer, type TrackReference } from '@livekit/components-react'
import microphoneLottie from '@/lotties/microphone-lottie.json'

export function RecordingIndicator({ micTrackRef, isListening = true, className }: { micTrackRef: TrackReference | undefined; isListening?: boolean; className?: string }) {
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    if (!isListening) {
      setIsRecording(false)
      return
    }
    if (!micTrackRef?.publication?.track) return
    const track = micTrackRef.publication.track
    if (!track.mediaStreamTrack) return

    let audioContext: AudioContext | undefined
    let analyser: AnalyserNode | undefined
    let microphone: MediaStreamAudioSourceNode | undefined
    let dataArray: Uint8Array
    let raf = 0

    const init = async () => {
      try {
        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        // 提高平滑，降低短时抖动敏感度
        analyser.smoothingTimeConstant = 0.7
        // 提高 minDecibels，降低整体敏感度
        analyser.minDecibels = -70
        analyser.maxDecibels = -10
        const bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
        const stream = new MediaStream([track.mediaStreamTrack])
        microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)
        // 频带限制到语音主频带，避开低频环境噪声
        const hzPerBin = audioContext.sampleRate / 2 / bufferLength
        const startBin = Math.max(0, Math.floor(300 / hzPerBin))
        const endBin = Math.min(bufferLength - 1, Math.ceil(3400 / hzPerBin))

        // 指标平滑与滞回去抖
        let ema = 0
        const alpha = 0.85 // EMA 平滑系数
        const ON_THRESHOLD = 18 // 触发阈值（更高 => 更不敏感）
        const OFF_THRESHOLD = 12 // 关闭阈值（低于开启，形成滞回区）
        const ON_FRAMES = 3 // 连续帧数才能触发（~50ms）
        const OFF_FRAMES = 6 // 连续帧数才能关闭（~100ms）
        let aboveFrames = 0
        let belowFrames = 0

        const tick = () => {
          analyser!.getByteFrequencyData(dataArray)
          // 语音带 RMS
          let sumSq = 0
          let count = 0
          for (let i = startBin; i <= endBin; i++) {
            const v = dataArray[i]
            sumSq += v * v
            count++
          }
          const bandRms = Math.sqrt(sumSq / Math.max(1, count))
          // EMA 平滑
          ema = alpha * ema + (1 - alpha) * bandRms

          if (!track.isMuted && ema >= ON_THRESHOLD) {
            aboveFrames++
            belowFrames = 0
            if (aboveFrames >= ON_FRAMES) setIsRecording(true)
          } else if (ema <= OFF_THRESHOLD || track.isMuted) {
            belowFrames++
            aboveFrames = 0
            if (belowFrames >= OFF_FRAMES) setIsRecording(false)
          } else {
            // 落在滞回区：保持当前状态
            aboveFrames = 0
            belowFrames = 0
          }

          raf = requestAnimationFrame(tick)
        }
        tick()
      } catch (_e) {
        setIsRecording(!track.isMuted)
      }
    }
    init()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (audioContext && audioContext.state !== 'closed') audioContext.close()
    }
  }, [micTrackRef, isListening])

  if (!micTrackRef) return null

  return (
    <div className={className}>
      <div className='hidden'>
        <BarVisualizer trackRef={micTrackRef} barCount={1} options={{ minHeight: 1 }}>
          <div />
        </BarVisualizer>
      </div>
      <div className='w-80'>
        <Lottie animationData={microphoneLottie} loop={isRecording && isListening} autoplay={isRecording && isListening} className='h-full w-full' />
      </div>
    </div>
  )
}


