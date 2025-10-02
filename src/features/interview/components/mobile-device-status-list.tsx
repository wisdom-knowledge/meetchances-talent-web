import { IconVideo, IconHeadphones, IconMicrophone, IconCircleCheckFilled } from '@tabler/icons-react'
import { DeviceTestStatus } from '@/types/device'
import { cn } from '@/lib/utils'

interface MobileDeviceStatusListProps {
  cameraStatus: DeviceTestStatus
  micStatus: DeviceTestStatus
  spkStatus: DeviceTestStatus
}

export function MobileDeviceStatusList({
  cameraStatus,
  micStatus,
  spkStatus,
}: MobileDeviceStatusListProps) {
  const devices = [
    {
      icon: IconVideo,
      label: '摄像头',
      status: cameraStatus,
    },
    {
      icon: IconHeadphones,
      label: '扬声器',
      status: spkStatus,
    },
    {
      icon: IconMicrophone,
      label: '麦克风',
      status: micStatus,
    },
  ]

  const getStatusText = (status: DeviceTestStatus) => {
    switch (status) {
      case DeviceTestStatus.Success:
        return '测试完成'
      case DeviceTestStatus.Testing:
        return '测试中'
      case DeviceTestStatus.Failed:
        return '测试失败'
      default:
        return '未测试'
    }
  }

  const getStatusColor = (status: DeviceTestStatus) => {
    if (status === DeviceTestStatus.Success) {
      return 'text-primary'
    }
    return 'text-muted-foreground'
  }

  const renderStatus = (status: DeviceTestStatus) => {
    if (status === DeviceTestStatus.Success) {
      return (
        <div className='flex items-center gap-1'>
          <IconCircleCheckFilled className='h-4 w-4 text-primary' />
          <span className='text-sm font-normal text-primary'>测试完成</span>
        </div>
      )
    }
    return (
      <span className={cn('text-sm font-normal', getStatusColor(status))}>
        {getStatusText(status)}
      </span>
    )
  }

  return (
    <div className='space-y-0'>
      {devices.map((device) => (
        <div
          key={device.label}
          className={cn(
            'flex items-center justify-between py-2'
          )}
        >
          <div className='flex items-center gap-3'>
            <device.icon className='h-5 w-5 text-foreground' />
            <span className='text-base font-normal text-foreground'>{device.label}</span>
          </div>
          {renderStatus(device.status)}
        </div>
      ))}
    </div>
  )
}

