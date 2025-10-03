import InterviewTimer from './interview-timer'
import { ConnectionQualityBars } from '@/components/interview/connection-quality-bars'
import LiteAgentTile from './lite-agent-tile'
import { Button } from '@/components/ui/button'
import LocalVideoTile from './local-video-tile'
import RecordingIndicator from './recording-indicator'
import { ChatMessageView } from './chat-message-view'
import ConnectionStatus from './connection-status'

interface MobileLayoutProps {
  onLeave: () => void
}

export default function MobileLayout({ onLeave }: MobileLayoutProps) {
  return (
    <div className='fixed inset-0 flex flex-col bg-gradient-to-b from-purple-100 to-purple-200'>
      {/* 上方：InterviewTimer 和 ConnectionQualityBars，靠左布局 */}
      <div className='flex items-center gap-2 px-4 pt-4'>
        <InterviewTimer active={true} />
        <ConnectionQualityBars />
      </div>

      {/* 第二行：LocalVideoTile 在左，LiteAgentTile 居中 */}
      <div className='flex items-center px-4'>
        <LocalVideoTile className='h-32 w-21 flex-shrink-0 rounded-2xl overflow-hidden bg-black' />
        <div className='flex flex-2 items-center justify-center pt-1'>
          <LiteAgentTile className='h-48 w-48' />
        </div>
        <div className='w-24'></div>
      </div>

      {/* 中间部分：flex-1 填满剩余空间，字幕区域（移动端居中布局） */}
      <div className='flex-1 flex-col items-center justify-start px-6'>
        <div className='w-full max-w-md'>
          <ChatMessageView>
            <ConnectionStatus className='w-full scale-[0.8]' />
          </ChatMessageView>
        </div>
      </div>

      {/* 下方：RecordingIndicator 和「放弃按钮」，flex-col 居中布局 */}
      <div className='flex flex-col items-center pb-8'>
        <RecordingIndicator className='w-full px-[50px]' />
        <Button
          variant='default'
          onClick={onLeave}
          className='font-mono'
        >
          放弃面试
        </Button>
      </div>
    </div>
  )
}

