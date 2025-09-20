import { use, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useDeviceState } from '../lib/useCommon'
import RtcClient from '../lib/RtcClient'
import { MediaType, VideoRenderMode } from '@volcengine/rtc';
import useRoomStore from '@/stores/interview/room'
import { is } from 'date-fns/locale';

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
  }, [])
  const setVideoPlayer = async () => {
    // 先移除之前的player
    RtcClient.removeVideoPlayer(userId!)
    // 开启推流
    await RtcClient.publishStream(MediaType.AUDIO_AND_VIDEO)
    // 设置新的player
    RtcClient.setLocalVideoPlayer(
      userId!,
      'local-video-player',
      false,
      VideoRenderMode.RENDER_MODE_FILL
    )
  }

  useEffect(() => {
    if (isVideoPublished) {
      setVideoPlayer()
    } 
  }, [isVideoPublished])
  return (
    <div className={cn('relative', className)} {...props} id="local-video-player">
    </div>
  )
}


