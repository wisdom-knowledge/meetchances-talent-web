'use client'

import { useEffect } from 'react'
import { useMaybeRoomContext, useMediaDeviceSelect } from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPreferredDeviceId, setPreferredDeviceId } from '@/lib/devices'

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

  // 初始挂载时，尝试应用本地存储的首选设备
  useEffect(() => {
    const preferred = getPreferredDeviceId(kind)
    if (preferred && preferred !== activeDeviceId) {
      setActiveMediaDevice(preferred)
    }
    // 仅在 mount 时尝试一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 用户切换设备时，写入本地存储
  const handleChange = (value: string) => {
    setActiveMediaDevice(value)
    setPreferredDeviceId(kind, value)
  }

  return (
    <Select value={activeDeviceId} onValueChange={handleChange}>
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


