import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface DeviceSelectLiteProps extends React.ComponentProps<typeof SelectTrigger> {
  kind: 'audioinput' | 'videoinput'
  value?: string
  onChange?: (deviceId: string) => void
}

export default function DeviceSelectLite({ kind, value, onChange, className, ...props }: DeviceSelectLiteProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        setDevices(list.filter((d) => d.kind === kind))
      } catch {}
    }
    void load()
    try { navigator.mediaDevices.addEventListener('devicechange', load) } catch {}
    return () => { try { navigator.mediaDevices.removeEventListener('devicechange', load) } catch {} }
  }, [kind])

  return (
    <Select value={value} onValueChange={(v) => onChange?.(v)}>
      <SelectTrigger className={cn('w-[180px] rounded-full px-3 py-2 text-sm', className)} {...props}>
        <SelectValue placeholder={`选择 ${kind === 'audioinput' ? '麦克风' : '摄像头'}`} />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.deviceId || device.label} value={device.deviceId} className='font-mono text-xs'>
            {device.label || device.deviceId || '默认设备'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


