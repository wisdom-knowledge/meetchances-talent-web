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
      return { text: '聆听中', color: 'bg-green-400', pulse: true }
    case 'thinking':
      return { text: '思考中', color: 'bg-[#9469EC]', pulse: true }
    default:
      return { text: '未知状态', color: 'bg-gray-400', pulse: false }
  }
}

export function ConnectionStatus({ className }: { className?: string }) {
  const { state } = useVoiceAssistant()
  const status = getStatusInfo(state)
  return (
    <div
      className={cn(
        'flex items-center gap-2 w-full justify-center rounded-[31px] px-6 py-3 mt-4 mb-1',
        'bg-[#DBB8FA] border-[0.5px] border-[rgba(255,255,255,0.12)]',
        'shadow-[0_0_4px_0_rgba(0,0,0,0.25)]',
        className,
      )}
    >
      <div className={cn('h-2 w-2 rounded-full', status.color, status.pulse && 'animate-pulse')} />
      <span className='text-white text-[14px] leading-[100%] tracking-[0.35px] font-medium font-["Noto_Sans_SC"]'>
        {status.text}
      </span>
    </div>
  )
}


