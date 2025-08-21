'use client'

import { useMaybeRoomContext, useMediaDeviceSelect } from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface DeviceSelectProps extends React.ComponentProps<typeof SelectTrigger> {
  kind: MediaDeviceKind
  requestPermissions?: boolean
  onMediaDeviceError?: (error: Error) => void
}

export function DeviceSelect({ kind, requestPermissions, onMediaDeviceError, className, ...props }: DeviceSelectProps) {
  const room = useMaybeRoomContext()
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind,
    room,
    requestPermissions,
    onError: onMediaDeviceError,
  })

  return (
    <Select value={activeDeviceId} onValueChange={setActiveMediaDevice}>
      <SelectTrigger className={cn('w-[180px] rounded-full px-3 py-2 text-sm', className)} {...props}>
        <SelectValue placeholder={`选择 ${kind === 'audioinput' ? '麦克风' : kind === 'videoinput' ? '摄像头' : '设备'}`} />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.deviceId} value={device.deviceId} className='font-mono text-xs'>
            {device.label || device.deviceId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


