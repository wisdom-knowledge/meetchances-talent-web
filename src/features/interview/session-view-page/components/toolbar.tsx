import { useCallback, useMemo, useState } from 'react'
import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { cn } from '@/lib/utils'
import { TrackToggle } from '@/components/livekit/track-toggle'
import { DeviceSelect } from '@/features/interview/session-view'

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Toolbar({ className, ...props }: ToolbarProps) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [pending, setPending] = useState<'mic' | 'cam' | null>(null)

  const micPressed = useMemo(() => !localParticipant.getTrackPublication(Track.Source.Microphone)?.isMuted, [localParticipant])
  const camPressed = useMemo(() => !localParticipant.getTrackPublication(Track.Source.Camera)?.isMuted, [localParticipant])

  const toggleMic = useCallback(async () => {
    if (!room) return
    setPending('mic')
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Microphone)
      const next = Boolean(pub?.isMuted)
      await room.localParticipant.setMicrophoneEnabled(next)
    } finally {
      setPending(null)
    }
  }, [room, localParticipant])

  const toggleCam = useCallback(async () => {
    if (!room) return
    setPending('cam')
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Camera)
      const next = Boolean(pub?.isMuted)
      await room.localParticipant.setCameraEnabled(next)
    } finally {
      setPending(null)
    }
  }, [room, localParticipant])

  return (
    <div className={cn('flex items-center gap-2 rounded-full bg-background/70 px-2 py-1 shadow-sm backdrop-blur', className)} {...props}>
      <TrackToggle source={Track.Source.Camera} pressed={camPressed} pending={pending === 'cam'} onPressedChange={toggleCam} />
      <TrackToggle source={Track.Source.Microphone} pressed={micPressed} pending={pending === 'mic'} onPressedChange={toggleMic} />
      <div className='mx-1 h-4 w-px bg-border' />
      <DeviceSelect kind='videoinput' className='h-8 w-[180px]' />
      <DeviceSelect kind='audioinput' className='h-8 w-[180px]' />
    </div>
  )
}


