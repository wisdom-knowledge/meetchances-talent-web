'use client'

import { Track } from 'livekit-client'
import { Toggle } from '../ui/toggle'
import { Mic, MicOff, MonitorUp, Video, VideoOff } from 'lucide-react'

export interface TrackToggleProps extends Omit<React.ComponentProps<typeof Toggle>, 'disabled'> {
  source: Track.Source
  pending?: boolean
  disabled?: boolean
}

export function TrackToggle({ source, pressed, pending, children, ...props }: TrackToggleProps) {
  const Icon = pending
    ? undefined
    : source === Track.Source.Microphone
    ? pressed
      ? Mic
      : MicOff
    : source === Track.Source.Camera
    ? pressed
      ? Video
      : VideoOff
    : MonitorUp

  return (
    <Toggle pressed={pressed} aria-label={`Toggle ${source}`} {...props}>
      {Icon ? <Icon className={pending ? 'animate-spin' : ''} /> : null}
      {children}
    </Toggle>
  )
}


