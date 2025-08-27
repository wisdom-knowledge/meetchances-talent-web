'use client'

import { useCallback, useState } from 'react'
import { Track } from 'livekit-client'
import { useRemoteParticipants, useRoomContext, useTrackToggle } from '@livekit/components-react'
import { Button } from '@/components/ui/button'
// import { Toggle } from '@/components/ui/toggle'
import { DeviceSelect } from '@/components/livekit/device-select'
import { TrackToggle } from './track-toggle'
// import { useNavigate } from '@tanstack/react-router'

interface AgentControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDisconnect?: () => void
  onSendMessage?: (message: string) => Promise<void>
}

export function AgentControlBar({ className, onDisconnect, onSendMessage, ...props }: AgentControlBarProps) {
  const participants = useRemoteParticipants()
  const isAgentAvailable = participants.some((p) => (p as unknown as { isAgent?: boolean }).isAgent)
  const room = useRoomContext()
  // const navigate = useNavigate()

  const micToggle = useTrackToggle({ source: Track.Source.Microphone })
  const camToggle = useTrackToggle({ source: Track.Source.Camera })
  const screenToggle = useTrackToggle({ source: Track.Source.ScreenShare })

  const [chatOpen, setChatOpen] = useState(true)

  const onLeave = useCallback(async () => {
    try {
      await room?.disconnect?.()
    } finally {
      onDisconnect?.()
      // 返回到准备页，便于继续调试页面结构
      // navigate({ to: '/interview' })
    }
  }, [onDisconnect, room])

  return (
    <div className={`bg-background border flex flex-col rounded-[31px] border p-3 shadow ${className ?? ''}`} {...props}>
      <div className='flex flex-row justify-between gap-1'>
        <div className='flex gap-1'>
          <div className='flex items-center gap-0'>
            <TrackToggle
              source={Track.Source.Microphone}
              disabled={Boolean(micToggle.pending)}
              onPressedChange={micToggle.toggle}
              className='peer/track w-auto pr-3 pl-3 md:rounded-r-none md:border-r-0 md:pr-2'
            />
            <DeviceSelect size='sm' kind='audioinput' className='hidden rounded-l-none md:block' />
          </div>

          <div className='flex items-center gap-0'>
            <TrackToggle
              source={Track.Source.Camera}
              disabled={Boolean(camToggle.pending)}
              onPressedChange={camToggle.toggle}
              className='w-auto rounded-r-none pr-3 pl-3 md:border-r-0 md:pr-2'
            />
            <DeviceSelect size='sm' kind='videoinput' className='rounded-l-none' />
          </div>

          <div className='flex items-center gap-0'>
            <TrackToggle
              source={Track.Source.ScreenShare}
              disabled={Boolean(screenToggle.pending)}
              onPressedChange={screenToggle.toggle}
              className='w-auto'
            />
          </div>

          <Button type='button' variant={chatOpen ? 'default' : 'outline'} size='sm' disabled={!isAgentAvailable} className='h-full'
            onClick={() => setChatOpen((v) => !v)}>
            <span className='text-xs'>字幕</span>
          </Button>
        </div>

        <Button variant='destructive' onClick={onLeave} className='font-mono'>结束</Button>
      </div>
    </div>
  )
}


