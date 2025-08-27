import { useMemo } from 'react'
import { useChat, useTranscriptions, type ReceivedChatMessage } from '@livekit/components-react'
import { useRoomContext } from '@livekit/components-react'
import { transcriptionToChatMessage } from '@/lib/livekit-utils'

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

  return { messages: mergedTranscriptions, latestAgentMessage, send: chat.send }
}


