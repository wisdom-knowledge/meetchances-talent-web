'use client'

import { Button } from '@/components/ui/button'

interface AgentControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onQuitButtonClick?: () => void
}

export function AgentControlBar({ className, onQuitButtonClick, ...props }: AgentControlBarProps) {

  return (
    <div className={`flex flex-col rounded-[31px]  ${className ?? ''}`} {...props}>
      <div className='flex flex-row justify-end gap-1'>
        <Button variant='default' onClick={() => onQuitButtonClick?.()} className='font-mono'>放弃面试</Button>
      </div>
    </div>
  )
}


