import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconPlayerPlay, IconSearch } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'

interface TranscriptItem {
  timestamp: string
  speaker: 'AI面试官' | '候选人'
  content: string
}

interface InterviewRecordingData {
  videoUrl: string
  videoThumbnail: string
  language: string
  transcript: TranscriptItem[]
}

interface InterviewRecordingSectionProps {
  data: InterviewRecordingData
}

export default function InterviewRecordingSection({ data }: InterviewRecordingSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlayClick = () => {
    if (!showVideo) {
      setShowVideo(true)
      setIsPlaying(true)
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900 mb-1'>
            AI面试录音
          </h2>
        </div>
      </div>
      
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* 左侧视频播放器 */}
        <div className='relative'>
          <div className='aspect-video bg-gray-900 rounded-xl overflow-hidden relative'>
            {showVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={data.videoUrl}
                  className='w-full h-full object-cover'
                  controls
                  autoPlay
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                  poster={data.videoThumbnail}
                >
                  您的浏览器不支持视频播放。
                </video>
                {/* 播放/暂停按钮覆盖层 */}
                {!isPlaying && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                    <Button 
                      size='lg'
                      variant='secondary'
                      className='w-16 h-16 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg'
                      onClick={handlePlayClick}
                    >
                      <IconPlayerPlay size={24} className='ml-1' />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <img 
                  src={data.videoThumbnail} 
                  alt="面试视频缩略图"
                  className='w-full h-full object-cover'
                />
                {/* 播放按钮覆盖层 */}
                <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                  <Button 
                    size='lg'
                    variant='secondary'
                    className='w-16 h-16 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg'
                    onClick={handlePlayClick}
                  >
                    <IconPlayerPlay size={24} className='ml-1' />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 右侧对话记录 */}
        <div className='flex flex-col'>
          {/* 标题栏 */}
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 tracking-wide'>
              对话记录
            </h3>
            <Button 
              variant='ghost' 
              size='sm'
              className='text-gray-500 hover:text-gray-700'
            >
              <IconSearch size={16} />
            </Button>
          </div>

          {/* 对话记录列表 */}
          <div className='flex-1 space-y-6 max-h-96 overflow-y-auto pr-2'>
            {data.transcript.map((item, index) => (
              <div key={index} className='flex gap-4'>
                {/* 时间戳 */}
                <div className='flex-shrink-0 w-12'>
                  <Badge 
                    variant='outline' 
                    className='text-xs font-mono bg-blue-50 text-blue-600 border-blue-200'
                  >
                    {item.timestamp}
                  </Badge>
                </div>
                
                {/* 对话内容 */}
                <div className='flex-1 min-w-0'>
                  <div className='mb-1'>
                    <span className={`text-sm font-medium ${
                      item.speaker === 'AI面试官' 
                        ? 'text-blue-600' 
                        : 'text-gray-900'
                    }`}>
                      {item.speaker}
                    </span>
                  </div>
                  <p className='text-sm text-gray-700 leading-relaxed'>
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
