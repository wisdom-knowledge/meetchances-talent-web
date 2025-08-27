import type { AgentState } from '@livekit/components-react'
import { useVoiceAssistant } from '@livekit/components-react'
import { cn } from '@/lib/utils'

function getStatusInfo(state: AgentState | undefined) {
  switch (state) {
    case 'connecting':
      return { text: '连接中...', color: 'bg-yellow-400', pulse: true }
    case 'disconnected':
      return { text: '已断开', color: 'bg-red-400', pulse: false }
    case 'speaking':
      return { text: '语音中', color: 'bg-blue-400', pulse: false }
    case 'listening':
      return { text: '监听中', color: 'bg-green-400', pulse: true }
    case 'thinking':
      return { text: '思考中', color: 'bg-purple-400', pulse: true }
    default:
      return { text: '未知状态', color: 'bg-gray-400', pulse: false }
  }
}

export function ConnectionStatus({ className }: { className?: string }) {
  const { state } = useVoiceAssistant()
  const status = getStatusInfo(state)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('h-2 w-2 rounded-full', status.color, status.pulse && 'animate-pulse')} />
      <span className='text-fg2 text-sm font-medium'>{status.text}</span>
    </div>
  )
}


