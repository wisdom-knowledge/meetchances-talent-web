import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useDeviceState } from '../lib/useCommon'
import RtcClient from '../lib/RtcClient'
import useRoomStore from '@/stores/interview/room'

interface LocalVideoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  stream?: MediaStream | null
  recordingStatus?: number
}

export default function LocalVideoTile({ stream, recordingStatus, className, ...props }: LocalVideoTileProps) {
  const rtcConnectionInfo = useRoomStore((s) => s.rtcConnectionInfo)
  const { isVideoPublished, switchCamera } = useDeviceState()
  const userId = rtcConnectionInfo?.user_id

  useEffect(() => {
    switchCamera(true)
    // 仅在首次挂载时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const setVideoPlayer = async () => {
    // 先移除之前的player
    RtcClient.removeVideoPlayer(userId!)
    // 开启推流
    const { MediaType, VideoRenderMode } = await import('@volcengine/rtc')
    await RtcClient.publishStream(MediaType.AUDIO_AND_VIDEO)
    // 设置新的player
    RtcClient.setLocalVideoPlayer(
      userId!,
      'local-video-player',
      false,
      VideoRenderMode.RENDER_MODE_FIT
    )
  }

  useEffect(() => {
    if (isVideoPublished) {
      void setVideoPlayer()
    }
    // setVideoPlayer 仅在 isVideoPublished 变化时调用
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoPublished])
  return (
    <div className={cn('relative', className)} {...props} id="local-video-player">
    </div>
  )
}


