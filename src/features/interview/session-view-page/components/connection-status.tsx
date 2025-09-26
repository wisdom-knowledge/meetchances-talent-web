'use client'

import { cn } from '@/lib/utils'
import { useRoomStore } from '@/stores/interview/room'

function getStatusInfo(params: { isThinking: boolean; isTalking: boolean }) {
  const { isThinking, isTalking } = params
  if (isThinking) return { text: '思考中', color: 'bg-[#9469EC]', pulse: true }
  if (isTalking) return { text: '语音中', color: 'bg-blue-400', pulse: false }
  return { text: '聆听中', color: 'bg-green-400', pulse: true }
}

export default function ConnectionStatus({ className }: { className?: string }) {
  const isAIThinking = useRoomStore((s) => s.isAIThinking)
  const isAITalking = useRoomStore((s) => s.isAITalking)
  const status = getStatusInfo({ isThinking: isAIThinking, isTalking: isAITalking })
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


