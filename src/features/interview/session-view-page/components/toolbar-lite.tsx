import { useCallback } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Video, VideoOff, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import DeviceSelectLite from './device-select-lite'

interface ToolbarLiteProps extends React.HTMLAttributes<HTMLDivElement> {
  cameraEnabled: boolean
  micEnabled: boolean
  cameraDeviceId?: string
  micDeviceId?: string
  onToggleCamera: (next: boolean) => void
  onToggleMic: (next: boolean) => void
  onSelectCamera: (deviceId: string) => void
  onSelectMic: (deviceId: string) => void
}

export default function ToolbarLite({
  className,
  cameraEnabled,
  micEnabled,
  cameraDeviceId,
  micDeviceId,
  onToggleCamera,
  onToggleMic,
  onSelectCamera,
  onSelectMic,
  ...props
}: ToolbarLiteProps) {
  const handleCam = useCallback(() => onToggleCamera(!cameraEnabled), [cameraEnabled, onToggleCamera])
  const handleMic = useCallback(() => onToggleMic(!micEnabled), [micEnabled, onToggleMic])

  return (
    <div className={cn('flex items-center gap-2 rounded-full bg-background/70 px-2 py-1 shadow-sm backdrop-blur', className)} {...props}>
      <Toggle pressed={cameraEnabled} onPressedChange={handleCam} aria-label='Toggle camera'>
        {cameraEnabled ? <Video className='h-4 w-4' /> : <VideoOff className='h-4 w-4' />}
      </Toggle>
      <Toggle pressed={micEnabled} onPressedChange={handleMic} aria-label='Toggle microphone'>
        {micEnabled ? <Mic className='h-4 w-4' /> : <MicOff className='h-4 w-4' />}
      </Toggle>
      <div className='mx-1 h-4 w-px bg-border' />
      <DeviceSelectLite kind='videoinput' value={cameraDeviceId} onChange={onSelectCamera} className='h-8 w-[180px]' />
      <DeviceSelectLite kind='audioinput' value={micDeviceId} onChange={onSelectMic} className='h-8 w-[180px]' />
    </div>
  )
}


