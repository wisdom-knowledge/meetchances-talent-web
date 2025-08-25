'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TestStatus = 'idle' | 'testing' | 'success' | 'failed'

interface LocalCameraPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  heightClass?: string
  onStatusChange?: (status: TestStatus) => void
  deviceId?: string | null
}

export function LocalCameraPreview({ className, heightClass = 'h-80', onStatusChange, deviceId, ...props }: LocalCameraPreviewProps) {
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
  }, [deviceId, onStatusChange, stream])

  return (
    <div className={className} {...props}>
      <Card className='overflow-hidden'>
        <div className={cn('relative bg-black', heightClass)}>
          <video ref={videoRef} playsInline muted className='h-full w-full object-cover' />
        </div>
        <div className='flex items-center justify-end gap-3 p-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              // 重新获取权限/刷新流
              void navigator.mediaDevices.getUserMedia({ video: true }).then(() => {
                // 触发 effect：基于当前 deviceId 重新拉流
                onStatusChange?.('testing')
                // 改变依赖即可由 effect 重建流
              })
            }}
          >
            测试摄像头
          </Button>
        </div>
      </Card>
    </div>
  )
}


