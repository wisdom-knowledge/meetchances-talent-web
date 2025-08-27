'use client'

import { useCallback } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Button } from '@/components/ui/button'

interface AgentControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDisconnect?: () => void
  onSendMessage?: (message: string) => Promise<void>
}

export function AgentControlBar({ className, onDisconnect, onSendMessage, ...props }: AgentControlBarProps) {
  const room = useRoomContext()

  const onLeave = useCallback(async () => {
    try {
      await room?.disconnect?.()
    } finally {
      onDisconnect?.()
    }
  }, [onDisconnect, room])

  return (
    <div className={`bg-background border flex flex-col rounded-[31px] border p-3 shadow ${className ?? ''}`} {...props}>
      <div className='flex flex-row justify-end gap-1'>
        <Button variant='destructive' onClick={onLeave} className='font-mono'>结束</Button>
      </div>
    </div>
  )
}


