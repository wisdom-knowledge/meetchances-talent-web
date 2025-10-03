import InterviewTimer from './interview-timer'
import { ConnectionQualityBars } from '@/components/interview/connection-quality-bars'
import { ChatMessageView } from './chat-message-view'
import ConnectionStatus from './connection-status'
import LiteAgentTile from './lite-agent-tile'
import { Button } from '@/components/ui/button'
import LocalVideoTile from './local-video-tile'
import RecordingIndicator from './recording-indicator'

interface DesktopLayoutProps {
  onLeave: () => void
}

export default function DesktopLayout({ onLeave }: DesktopLayoutProps) {
  return (
    <div className='space-y-6'>
      {/* 顶部：计时器 + 网络状态 */}
      <div className='fixed top-20 right-6 z-50 flex items-center gap-3'>
        <InterviewTimer active={true} />
        <ConnectionQualityBars />
      </div>

      {/* 右侧：字幕区域（PC端栅格布局） */}
      <div className='fixed inset-0 z-40'>
        <div className='grid h-full w-full grid-cols-3'>
          <div className='col-span-2' />
          <div className='col-span-1 flex h-full flex-col justify-center px-8'>
            <div className='max-w-md space-y-3 px-1'>
              <ChatMessageView>
                <ConnectionStatus />
              </ChatMessageView>
            </div>
          </div>
        </div>
      </div>

      {/* AgentTile 居中 */}
      <div className='fixed inset-0 z-20 flex items-center justify-center'>
        <LiteAgentTile className='h-64 w-96' />
      </div>

      {/* 底部：左本地视频 | 中录音指示器占位 | 右控制条 */}
      <div className='fixed inset-x-0 bottom-12 z-50 px-6'>
        <div className='flex w-full items-end gap-4'>
          <div className='min-w-[8rem] flex-1'>
            <LocalVideoTile className='h-48 w-64 rounded-md overflow-hidden border bg-black' />
          </div>
          <div className='flex flex-1 justify-center -mb-10'>
            <RecordingIndicator />
          </div>
          <div className='flex flex-1 justify-end pointer-events-auto mb-4'>
            <div className='flex flex-col rounded-[31px]'>
              <div className='flex flex-row justify-end gap-1'>
                <Button variant='default' onClick={onLeave} className='font-mono'>
                  放弃面试
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

