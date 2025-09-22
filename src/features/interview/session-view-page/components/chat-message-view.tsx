'use client'

import { type RefObject, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { useRoomStore } from '@/stores/interview/room'

export function useAutoScroll(scrollContentContainerRef: RefObject<Element | null>) {
  useEffect(() => {
    function scrollToBottom() {
      const { scrollingElement } = document
      if (scrollingElement) {
        scrollingElement.scrollTop = scrollingElement.scrollHeight
      }
    }

    if (scrollContentContainerRef.current) {
      const resizeObserver = new ResizeObserver(scrollToBottom)
      resizeObserver.observe(scrollContentContainerRef.current)
      scrollToBottom()
      return () => resizeObserver.disconnect()
    }
  }, [scrollContentContainerRef])
}

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const ChatMessageView = ({ className, children, ...props }: ChatProps) => {
  const scrollContentRef = useRef<HTMLDivElement>(null)
  useAutoScroll(scrollContentRef)
  const messages = useRoomStore((s) => s.msgHistory)
  const isThinking = useRoomStore((s) => s.isAIThinking)
  const isTalking = useRoomStore((s) => s.isAITalking)
  const clearHistoryMsg = useRoomStore((s) => s.clearHistoryMsg)

  const agentMessages = useMemo(() => {
    return messages.filter((m) => /ChatBot/.test(String(m.user)) && typeof m.value === 'string' && m.value.length > 0)
  }, [messages])

  // 当 Agent 从 thinking -> talking 切换时，清空历史字幕
  const prevRef = useRef<{ thinking: boolean; talking: boolean }>({ thinking: false, talking: false })
  useEffect(() => {
    const prev = prevRef.current
    if (prev.thinking && isTalking) {
      console.log('>>> clearHistoryMsg')
      clearHistoryMsg()
    }
    prevRef.current = { thinking: isThinking, talking: isTalking }
  }, [isThinking, isTalking, clearHistoryMsg])

  

  return (
    <div className={cn('h-full w-full', className)} {...props}>
      <div ref={scrollContentRef} className='grid h-full w-full grid-cols-3'>
        <div className='col-span-2' />
        <div className='col-span-1 flex h-full flex-col justify-center px-8'>
          <div className='max-w-md space-y-3'>
            <div className='overflow-y-auto whitespace-pre-wrap px-1'>
              <ul className='space-y-3'>
                {agentMessages.map((m, idx) => (
                  <li key={`${m.time}-${idx}`} className='group flex flex-col gap-0.5'>
                    <span className='ml-auto max-w-5/5 rounded-[20px] py-2 text-blue-600 leading-relaxed text-base/6'>
                      {m.value}
                    </span>
                  </li>
                ))}
              </ul>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


