import { useEffect, useMemo } from 'react'
import { useChat, useTranscriptions, type ReceivedChatMessage } from '@livekit/components-react'
import { useRoomContext } from '@livekit/components-react'
import { transcriptionToChatMessage } from '@/lib/livekit-utils'
import { reportInterviewFirstToken } from '@/lib/apm'

export default function useChatAndTranscription() {
  const transcriptions = useTranscriptions()
  const chat = useChat()
  const room = useRoomContext()

  const mergedTranscriptions = useMemo(() => {
    const merged: Array<ReceivedChatMessage> = [
      ...transcriptions.map((t) => transcriptionToChatMessage(t, room)),
      ...chat.chatMessages,
    ]
    return merged.sort((a, b) => a.timestamp - b.timestamp)
  }, [transcriptions, chat.chatMessages, room])

  const latestAgentMessage = useMemo(() => {
    const agentMessages = mergedTranscriptions.filter((m) => !m.from?.isLocal)
    return agentMessages.length > 0 ? agentMessages[agentMessages.length - 1] : undefined
  }, [mergedTranscriptions])

  // 首个远端消息（面试官第一句话）触发 first token 统计
  useEffect(() => {
    const firstAgent = mergedTranscriptions.find((m) => !m.from?.isLocal)
    if (firstAgent) {
      reportInterviewFirstToken({ source: 'agent' })
    }
  }, [mergedTranscriptions])

  return { messages: mergedTranscriptions, latestAgentMessage, send: chat.send }
}


