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
        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
        const stream = new MediaStream([track.mediaStreamTrack])
        microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)
        const tick = () => {
          analyser!.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length
          const isActive = average > 10 && !track.isMuted
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


