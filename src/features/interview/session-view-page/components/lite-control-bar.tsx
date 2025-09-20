import { Button } from '@/components/ui/button'

interface LiteControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onRequestEnd?: () => void
  onDisconnect?: () => void
}

export default function LiteControlBar({ className, onRequestEnd, onDisconnect, ...props }: LiteControlBarProps) {
  const onLeave = async () => {
    if (onRequestEnd) {
      onRequestEnd()
      return
    }
    onDisconnect?.()
  }

  return (
    <div className={`flex flex-col rounded-[31px] ${className ?? ''}`} {...props}>
      <div className='flex flex-row justify-end gap-1'>
        <Button variant='default' onClick={onLeave} className='font-mono'>放弃面试</Button>
      </div>
    </div>
  )
}


