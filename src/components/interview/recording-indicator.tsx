'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { BarVisualizer, type TrackReference } from '@livekit/components-react'
import microphoneLottie from '@/lotties/microphone-lottie.json'

export function RecordingIndicator({ micTrackRef, className }: { micTrackRef: TrackReference | undefined; className?: string }) {
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
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
        analyser.fftSize = 512 // 增加 FFT 大小以提高频率分辨率
        analyser.smoothingTimeConstant = 0.2 // 降低平滑常数以提高响应速度
        analyser.minDecibels = -90 // 设置更低的最小分贝值以提高敏感度
        analyser.maxDecibels = -10 // 设置最大分贝值
        const bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
        const stream = new MediaStream([track.mediaStreamTrack])
        microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)
        const tick = () => {
          analyser!.getByteFrequencyData(dataArray)
          // 使用 RMS 计算更准确的音量
          const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length)
          // 降低激活阈值并增加敏感度
          const isActive = rms > 3 && !track.isMuted // 从 10 降低到 3
          setIsRecording(isActive)
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
  }, [micTrackRef])

  if (!micTrackRef) return null

  return (
    <div className={className}>
      <div className='hidden'>
        <BarVisualizer trackRef={micTrackRef} barCount={1} options={{ minHeight: 1 }}>
          <div />
        </BarVisualizer>
      </div>
      <div className='w-80'>
        <Lottie animationData={microphoneLottie} loop={isRecording} autoplay={isRecording} className='h-full w-full' />
      </div>
    </div>
  )
}


