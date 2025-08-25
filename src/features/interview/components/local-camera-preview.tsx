'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type TestStatus = 'idle' | 'testing' | 'success' | 'failed'

interface LocalCameraPreviewProps extends React.HTMLAttributes<HTMLDivElement> {

  onStatusChange?: (status: TestStatus) => void
  deviceId?: string | null
}

export function LocalCameraPreview({ className, onStatusChange, deviceId, ...props }: LocalCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)


  useEffect(() => {
    const start = async () => {
      try {
        onStatusChange?.('testing')
        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        }
        const s = await navigator.mediaDevices.getUserMedia(constraints)
        setStream((prev) => {
          prev?.getTracks().forEach((t) => t.stop())
          return s
        })
        if (videoRef.current) {
          videoRef.current.srcObject = s
          await videoRef.current.play().catch(() => undefined)
        }
        onStatusChange?.('success')
      } catch (_e) {
        // ignore; UI 上交由权限提示
        onStatusChange?.('failed')
      }
    }
    void start()
    return () => {
      const prev = stream
      prev?.getTracks().forEach((t) => t.stop())
      setStream(null)
      onStatusChange?.('idle')
    }
    // 仅在 deviceId 变化时重建流，避免因 stream 状态变化导致的循环与闪烁
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  return (
    <div className={className} {...props}>
      <Card className='overflow-hidden py-0'>
        <div className={cn('relative bg-black aspect-video')}>
          <video ref={videoRef} playsInline muted className='h-full w-full object-cover' />
        </div>
        
      </Card>
    </div>
  )
}


