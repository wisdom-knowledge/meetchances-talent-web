import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Track, type Room } from 'livekit-client'
import Lottie from 'lottie-react';
import {
  type AgentState,
  type TrackReference,
  type ReceivedChatMessage,
  useLocalParticipant,
  useRoomContext,
  useVoiceAssistant
} from '@livekit/components-react'
import { ConnectionQualityBars } from '@/components/interview/connection-quality-bars'
import { ConnectionStatus } from '@/components/interview/connection-status'
import { InterviewTimer } from '@/components/interview/interview-timer'
import { RecordingIndicator } from '@/components/interview/recording-indicator'
import useChatAndTranscription from '@/hooks/use-chat-and-transcription'
import { AgentTile } from '@/components/livekit/chat/agent-tile';
import { ChatEntry } from '@/components/livekit/chat/chat-entry'
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view'
import voiceLottie from '@/lotties/voice-lottie.json';
import { AgentControlBar } from '@/components/livekit/agent-control-bar'

function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant()
  const publication = localParticipant.getTrackPublication(source)
  const trackRef = useMemo<TrackReference | undefined>(() => (publication ? { source, participant: localParticipant, publication } : undefined), [source, publication, localParticipant])
  return trackRef
}

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}
export interface SessionViewProps extends React.ComponentProps<'main'> {
  disabled: boolean
  sessionStarted: boolean
  onRequestEnd?: () => void
  onDisconnect?: () => void
}

export function SessionView({ disabled, sessionStarted, className, onRequestEnd, onDisconnect, ...props }: SessionViewProps) {
  const { state: agentState } = useVoiceAssistant()
  const { messages } = useChatAndTranscription()
  const room = useRoomContext() as Room | undefined
  const micTrack = useLocalTrackRef(Track.Source.Microphone)
  const cameraTrack = useLocalTrackRef(Track.Source.Camera)

  // 只显示最新的一条Agent消息
  const latestAgentMessage = useMemo(() => {
    const agentMessages = messages.filter((message) => !message.from?.isLocal);
    return agentMessages.length > 0 ? [agentMessages[agentMessages.length - 1]] : [];
  }, [messages]);

  // 连接后的简单保护：如果 session 未开始，确保本地轨道关闭
  useEffect(() => {
    if (!room) return
    if (!sessionStarted) {
      try {
        room.localParticipant.setCameraEnabled(false)
        room.localParticipant.setMicrophoneEnabled(false)
      } catch (_e) {
        // ignore
      }
    }
  }, [room, sessionStarted])

  return (
    <main inert={disabled} className={`relative h-[80vh] w-full overflow-hidden ${className ?? ''}`} {...props}>
      {/* 左上：连接状态 */}
      {sessionStarted && (
        <div className='fixed top-20 left-6 z-50'>
          <ConnectionStatus />
        </div>
      )}

      {/* 右上：计时器 + 网络状态（使用 LiveKit 组件） */}
      <div className='fixed top-20 right-6 z-50 flex items-center gap-3'>
        <InterviewTimer active={sessionStarted} />
        {sessionStarted && (
          <div className='flex items-center gap-2'>
            <ConnectionQualityBars />
          </div>
        )}
      </div>

      {/* 右侧：字幕区域（占位，后续接入字幕组件） */}
      <ChatMessageView className="fixed inset-0 z-40">
        <div className="grid h-full w-full grid-cols-3">
          {/* 左侧空白区域 */}
          <div className="col-span-2"></div>

          {/* 右侧字幕区域 - 靠左对齐 */}
          <div className="col-span-1 flex h-full flex-col justify-center px-8">
            <div className="max-w-md space-y-3">
              {/* Agent消息显示区域 */}
              <div className="overflow-y-auto whitespace-pre-wrap">
                <AnimatePresence>
                  {latestAgentMessage.map((message: ReceivedChatMessage) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      <ChatEntry hideName key={message.id} entry={message} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </ChatMessageView>


      {/* 连接期间的Lottie动画 - 页面正中间 */}
      {sessionStarted && !isAgentAvailable(agentState) && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <div className="animate-slow-spin h-60 w-60">
            <Lottie
              animationData={voiceLottie}
              loop={false}
              autoplay={false}
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      {/* AgentTile - 页面正中间 */}
      {sessionStarted && isAgentAvailable(agentState) && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <AgentTile state={agentState} className="h-64 w-96" />
        </div>
      )}

      {/* 底部一行：左 LocalVideoTile | 中 RecordingIndicator | 右 AgentControlBar */}
      {sessionStarted && (
        <div className='fixed inset-x-0 bottom-12 z-50 px-6'>
          <div className=' flex w-full items-end gap-4'>
            {/* 左：本地视频 */}
            <div className='min-w-[8rem] flex-1'>
              {cameraTrack && cameraTrack.publication?.track && !cameraTrack.publication.isMuted ? (
                <LocalVideoTile trackRef={cameraTrack} className='h-48 w-64 rounded-md overflow-hidden border bg-black' />
              ) : (
                <div className='h-24 w-32' />
              )}
            </div>

            {/* 中：录音指示器（居中） */}
            <div className='flex flex-1 justify-center -mb-10'>
              <RecordingIndicator micTrackRef={micTrack} />
            </div>

            {/* 右：控制条（可点击） */}
            <div className='flex flex-1 justify-end pointer-events-auto mb-4'>
              <AgentControlBar onRequestEnd={onRequestEnd} onDisconnect={onDisconnect} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function LocalVideoTile({ trackRef, className }: { trackRef: TrackReference; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const track = trackRef?.publication?.track
    const el = videoRef.current
    if (!track || !el) return
    // 先解绑避免重复 attach
    try { track.detach(el) } catch (_e) { /* no-op */ }
    track.attach(el)
    el.muted = true
    el.playsInline = true
    el.autoplay = true
    el.setAttribute('controls', 'false')
    const play = () => el.play().catch(() => undefined)
    play()
    return () => {
      try { track.detach(el) } catch (_e) { /* no-op */ }
    }
  }, [trackRef])
  return <video ref={videoRef} className={className} />
}


