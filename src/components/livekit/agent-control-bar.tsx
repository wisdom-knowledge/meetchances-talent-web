'use client'

import { useCallback } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Button } from '@/components/ui/button'

interface AgentControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDisconnect?: () => void
  onRequestEnd?: () => void
  onSendMessage?: (message: string) => Promise<void>
}

export function AgentControlBar({ className, onDisconnect, onRequestEnd, onSendMessage, ...props }: AgentControlBarProps) {
  const room = useRoomContext()

  const onLeave = useCallback(async () => {
    if (onRequestEnd) {
      onRequestEnd()
      return
    }
    try {
      await room?.disconnect?.()
    } finally {
      onDisconnect?.()
    }
  }, [onDisconnect, onRequestEnd, room])

  return (
    <div className={`flex flex-col rounded-[31px]  ${className ?? ''}`} {...props}>
      <div className='flex flex-row justify-end gap-1'>
        <Button variant='default' onClick={onLeave} className='font-mono'>放弃面试</Button>
      </div>
    </div>
  )
}


