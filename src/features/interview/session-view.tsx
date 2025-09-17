import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Track, type Room } from 'livekit-client'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
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
import { getPreferredDeviceId } from '@/lib/devices'
import { reportThinkingDuration, userEvent } from '@/lib/apm'

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
  onQuitButtonClick?: () => void
  recordingStatus?: number
  interviewId?: string | number
  jobId?: string | number
  jobApplyId?: string | number
}

export function SessionView({ disabled, sessionStarted, className, onQuitButtonClick, recordingStatus, interviewId, jobId, jobApplyId, ...props }: SessionViewProps) {
  const { state: agentState } = useVoiceAssistant()
  const { messages } = useChatAndTranscription()
  const room = useRoomContext() as Room | undefined
  const micTrack = useLocalTrackRef(Track.Source.Microphone)
  const cameraTrack = useLocalTrackRef(Track.Source.Camera)
  const connectingLottieRef = useRef<LottieRefCurrentProps>(null)

  // thinking 轮次与起止时间
  const [thinkingRound, setThinkingRound] = useState<number>(0)
  const thinkingStartRef = useRef<number | null>(null)

  // 会话回合序号（从0开始）；当 "agent start talk" 发生时 +1
  const currentRoundRef = useRef<number>(0)
  const prevAgentStateRef = useRef<AgentState | undefined>(undefined)
  const reportedRound2ReachedRef = useRef<boolean>(false)
  const reportedRound5ReachedRef = useRef<boolean>(false)

  function formatTimeHmsMs(d: Date): string {
    const pad = (n: number, w = 2) => String(n).padStart(w, '0')
    const HH = pad(d.getHours())
    const mm = pad(d.getMinutes())
    const ss = pad(d.getSeconds())
    const SSS = pad(d.getMilliseconds(), 3)
    return `${HH}:${mm}:${ss}.${SSS}`
  }

  const printRoundEvent = useCallback((round: number, event: string): void => {
    const nowStr = formatTimeHmsMs(new Date())
    // eslint-disable-next-line no-console
    console.log(`========== 第[${round}]轮==========`)
    // eslint-disable-next-line no-console
    console.log(`- 事件：${event}`)
    // eslint-disable-next-line no-console
    console.log(`- 时间点：${nowStr}`)
    // eslint-disable-next-line no-console
    console.log('=========================')
  }, [])

  // 监听 agentState 切换，计算 thinking 耗时 + 打印轮次事件
  useEffect(() => {
    if (!sessionStarted) {
      // 重置会话内统计
      setThinkingRound(0)
      thinkingStartRef.current = null
      currentRoundRef.current = 0
      prevAgentStateRef.current = undefined
      return
    }

    // 轮次与事件：
    // - agent start talk：当 agent 进入 speaking 时，当前回合 +1，并打印事件
    // - thinking start / end：打印事件，使用当前回合号（不改变回合号）

    const prev = prevAgentStateRef.current
    const curr = agentState

    // thinking start（不改变回合号）
    if (curr === 'thinking' && prev !== 'thinking') {
      const roundToPrint = currentRoundRef.current
      printRoundEvent(roundToPrint, 'thinking start')
      // 用户超过两轮对话（达到第3轮时）上报一次事件
      if (!reportedRound2ReachedRef.current && currentRoundRef.current === 2) {
        reportedRound2ReachedRef.current = true
        userEvent('interview_rounds_2_reached', '面试问答超过2轮', {
          job_id: jobId,
          interview_id: interviewId,
          job_apply_id: jobApplyId,
        })
      }
      // 用户达到第5轮对话时上报一次事件
      if (!reportedRound5ReachedRef.current && currentRoundRef.current === 5) {
        reportedRound5ReachedRef.current = true
        userEvent('interview_rounds_5_reached', '面试问答5轮', {
          job_id: jobId,
          interview_id: interviewId,
          job_apply_id: jobApplyId,
        })
      }
      if (thinkingStartRef.current == null) {
        thinkingStartRef.current = performance.now()
        setThinkingRound((prevRound) => prevRound + 1)
      }
    }

    // thinking end（不改变回合号）
    if (prev === 'thinking' && curr !== 'thinking') {
      const roundToPrint = currentRoundRef.current
      printRoundEvent(roundToPrint, 'thinking end')
      if (thinkingStartRef.current != null) {
        const duration = performance.now() - thinkingStartRef.current
        const round = currentRoundRef.current
        const extra = interviewId != null ? { Interview_id: String(interviewId) } : undefined
        reportThinkingDuration(round, duration, extra)
        thinkingStartRef.current = null
      }
    }

    // agent start talk：当 agent 进入 speaking，当前回合 +1 并记录事件
    if (curr === 'speaking' && prev !== 'speaking') {
      currentRoundRef.current = currentRoundRef.current + 1
      const roundToPrint = currentRoundRef.current
      printRoundEvent(roundToPrint, 'agent start talk')
    }

    // 用户说话结束：当 agent 从 speaking 转变为 listening/thinking，不再改变回合号

    prevAgentStateRef.current = curr
    // 在会话状态与 agentState 变化时响应
  }, [agentState, sessionStarted, thinkingRound, interviewId, jobId, jobApplyId, printRoundEvent])

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

  // 会话开始后，尽可能应用在 prepare 阶段存储的设备ID
  useEffect(() => {
    if (!room || !sessionStarted) return
    try {
      const preferredCam = getPreferredDeviceId('videoinput')
      if (preferredCam && preferredCam !== 'default') {
        void room.localParticipant.setCameraEnabled(true, { deviceId: preferredCam })
      }
      const preferredMic = getPreferredDeviceId('audioinput')
      if (preferredMic && preferredMic !== 'default') {
        void room.localParticipant.setMicrophoneEnabled(true, { deviceId: preferredMic })
      }
      // 输出设备（audiooutput）在浏览器中通常需要绑定到 HTMLMediaElement，这里保持在 prepare 中选择并写入存储即可
    } catch (_e) { /* ignore */ }
  }, [room, sessionStarted])

  // 连接期间的 Lottie 静态帧（例如 60%）
  useEffect(() => {
    if (sessionStarted && !isAgentAvailable(agentState)) {
      const totalFrames = ((voiceLottie as unknown as { op?: number }).op ?? 100) | 0
      const frame = Math.floor(totalFrames * 0.6)
      connectingLottieRef.current?.goToAndStop(frame, true)
    }
  }, [sessionStarted, agentState])

  return (
    <main inert={disabled} className={`relative h-[80vh] w-full overflow-hidden ${className ?? ''}`} {...props}>

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
              <div className="overflow-y-auto whitespace-pre-wrap px-1">
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
                <ConnectionStatus />
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
              lottieRef={connectingLottieRef}
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
                <LocalVideoTile trackRef={cameraTrack} className='h-48 w-64 rounded-md overflow-hidden border bg-black' recordingStatus={recordingStatus} />
              ) : (
                <div className='h-24 w-32' />
              )}
            </div>

            {/* 中：录音指示器（居中） */}
            <div className='flex flex-1 justify-center -mb-10'>
              <RecordingIndicator micTrackRef={micTrack} isListening={agentState === 'listening'} />
            </div>

            {/* 右：控制条（可点击） */}
            <div className='flex flex-1 justify-end pointer-events-auto mb-4'>
              <AgentControlBar onQuitButtonClick={onQuitButtonClick} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function LocalVideoTile({ trackRef, className, recordingStatus }: { trackRef: TrackReference; className?: string; recordingStatus?: number }) {
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
    // 禁用所有原生控件与画中画
    el.controls = false
    el.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback')
    el.setAttribute('disablepictureinpicture', 'true')
    const play = () => el.play().catch(() => undefined)
    play()
    return () => {
      try { track.detach(el) } catch (_e) { /* no-op */ }
    }
  }, [trackRef])
  const isRecording = recordingStatus === 10
  const isKnown = recordingStatus === 0 || recordingStatus === 10
  return (
    <div className={`relative ${className ?? ''}`}>
      <video ref={videoRef} className='h-full w-full object-cover' />
      {isKnown ? (
        <div className={`pointer-events-none absolute right-2 top-2 h-3 w-3 rounded-full ${isRecording? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
      ) : (
        <div className='pointer-events-none absolute right-2 top-2 text-xs font-semibold text-white/80'>-</div>
      )}
    </div>
  )
}


