import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface LocalVideoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  stream?: MediaStream | null
  recordingStatus?: number
}

export default function LocalVideoTile({ stream, recordingStatus, className, ...props }: LocalVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    try {
      el.srcObject = stream ?? null
      el.muted = true
      el.playsInline = true
      el.autoplay = true
      el.controls = false
      el.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback')
      el.setAttribute('disablepictureinpicture', 'true')
      const play = () => el.play().catch(() => undefined)
      play()
    } catch {}
  }, [stream])
  const isRecording = recordingStatus === 10
  const isKnown = recordingStatus === 0 || recordingStatus === 10
  return (
    <div className={cn('relative', className)} {...props}>
      <video ref={videoRef} className='h-full w-full object-cover bg-black' />
      {isKnown ? (
        <div className={`pointer-events-none absolute right-2 top-2 h-3 w-3 rounded-full ${isRecording? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
      ) : (
        <div className='pointer-events-none absolute right-2 top-2 text-xs font-semibold text-white/80'>-</div>
      )}
    </div>
  )
}


