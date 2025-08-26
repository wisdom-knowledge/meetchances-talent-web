import { useEffect, useMemo, useRef } from 'react'
import { Track, type Room } from 'livekit-client'
import { type TrackReference, useLocalParticipant, useRoomContext, useVoiceAssistant } from '@livekit/components-react'
import { ConnectionStatus } from '@/components/interview/connection-status'
import { InterviewTimer } from '@/components/interview/interview-timer'
import { RecordingIndicator } from '@/components/interview/recording-indicator'

function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant()
  const publication = localParticipant.getTrackPublication(source)
  const trackRef = useMemo<TrackReference | undefined>(() => (publication ? { source, participant: localParticipant, publication } : undefined), [source, publication, localParticipant])
  return trackRef
}

export interface SessionViewProps extends React.ComponentProps<'main'> {
  disabled: boolean
  sessionStarted: boolean
}

export function SessionView({ disabled, sessionStarted, className, ...props }: SessionViewProps) {
  const { state: _agentState } = useVoiceAssistant()
  const room = useRoomContext() as Room | undefined
  const micTrack = useLocalTrackRef(Track.Source.Microphone)
  const cameraTrack = useLocalTrackRef(Track.Source.Camera)

  // 连接后的简单保护：如果 session 未开始，确保本地轨道关闭
  useEffect(() => {
    if (!room) return
    if (!sessionStarted) {
      try {
        room.localParticipant.setCameraEnabled(false)
        room.localParticipant.setMicrophoneEnabled(false)
      } catch (_e) {
        // ignore
      }
    }
  }, [room, sessionStarted])

  return (
    <main inert={disabled} className={`relative h-[80vh] w-full overflow-hidden ${className ?? ''}`} {...props}>
      {/* 左上：连接状态 */}
      {sessionStarted && (
        <div className='fixed top-20 left-6 z-50'>
          <ConnectionStatus />
        </div>
      )}

      {/* 右上：计时器 */}
      <div className='fixed top-20 right-6 z-50'>
        <InterviewTimer active={sessionStarted} />
      </div>

      {/* 右侧：字幕区域（占位，后续接入字幕组件） */}
      <div className='pointer-events-none fixed inset-0 z-40'>
        <div className='grid h-full w-full grid-cols-3'>
          <div className='col-span-2' />
          <div className='col-span-1 flex h-full flex-col justify-center px-8'>
            <div className='max-w-md space-y-3'>
              <div className='overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground'>
                <div className='rounded-md border bg-background/60 p-3'>字幕区域（占位）</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 左下：本地视频占位（当相机开启时可替换为视频组件） */}
      {sessionStarted && cameraTrack && cameraTrack.publication?.track && !cameraTrack.publication.isMuted ? (
        <div className='pointer-events-none fixed bottom-32 left-6 z-30'>
          <LocalVideoTile trackRef={cameraTrack} className='h-48 w-64 rounded-md overflow-hidden border bg-black' />
        </div>
      ) : null}

      {/* 底部中：录音指示器（需要 micTrack） */}
      {sessionStarted && (
        <RecordingIndicator micTrackRef={micTrack} className='pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 transform' />
      )}
    </main>
  )
}

function LocalVideoTile({ trackRef, className }: { trackRef: TrackReference; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const track = trackRef?.publication?.track
    const el = videoRef.current
    if (!track || !el) return
    // 先解绑避免重复 attach
    try { track.detach(el) } catch (_e) { /* no-op */ }
    track.attach(el)
    el.muted = true
    el.playsInline = true
    el.autoplay = true
    el.setAttribute('controls', 'false')
    const play = () => el.play().catch(() => undefined)
    play()
    return () => {
      try { track.detach(el) } catch (_e) { /* no-op */ }
    }
  }, [trackRef])
  return <video ref={videoRef} className={className} />
}


