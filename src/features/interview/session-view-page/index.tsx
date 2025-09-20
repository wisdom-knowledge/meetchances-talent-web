import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import InterviewTimer from './components/interview-timer'
import { ConnectionQualityBars } from '@/components/interview/connection-quality-bars'
import { ChatMessageView } from './components/chat-message-view'
import LiteAgentTile from './components/lite-agent-tile'
import LiteControlBar from './components/lite-control-bar'
import LocalVideoTile from './components/local-video-tile'
import ToolbarLite from './components/toolbar-lite'
import { useEffect, useState } from 'react'

export default function InterviewSessionViewPage() {
  const [agentState, setAgentState] = useState<'listening' | 'thinking' | 'speaking'>('listening')
  const [micEnabled, setMicEnabled] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micDeviceId, setMicDeviceId] = useState<string | undefined>(undefined)
  const [camDeviceId, setCamDeviceId] = useState<string | undefined>(undefined)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  // 简单的 agentState demo：每 6s 从 listening -> thinking -> speaking -> listening
  useEffect(() => {
    const seq: Array<'listening' | 'thinking' | 'speaking'> = ['listening', 'thinking', 'speaking']
    let i = 0
    const t = setInterval(() => {
      i = (i + 1) % seq.length
      setAgentState(seq[i])
    }, 6000)
    return () => clearInterval(t)
  }, [])

  // 控制本地摄像头/麦克风流（不依赖 LiveKit）
  useEffect(() => {
    const enable = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraEnabled ? { deviceId: camDeviceId ? { exact: camDeviceId } : undefined } : false,
          audio: micEnabled ? { deviceId: micDeviceId ? { exact: micDeviceId } : undefined } : false,
        })
        setLocalStream((prev) => {
          prev?.getTracks().forEach((t) => t.stop())
          return stream
        })
      } catch {
        // ignore
      }
    }
    const disable = () => {
      setLocalStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop())
        return null
      })
    }
    if (cameraEnabled || micEnabled) {
      void enable()
    } else {
      disable()
    }
    return () => {
      setLocalStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop())
        return null
      })
    }
  }, [cameraEnabled, micEnabled, camDeviceId, micDeviceId])

  return (
    <>
      <Main fixed>

        <Separator className='my-4 lg:my-6' />

        <div className='space-y-6'>
          {/* 顶部：计时器 + 网络状态 */}
          <div className='fixed top-20 right-6 z-50 flex items-center gap-3'>
            <InterviewTimer active={true} />
            <ConnectionQualityBars />
          </div>

          {/* 右侧：字幕区域（保持结构一致） */}
          <ChatMessageView className='fixed inset-0 z-40'>
            <div className='grid h-full w-full grid-cols-3'>
              <div className='col-span-2'></div>
              <div className='col-span-1 flex h-full flex-col justify-center px-8'>
                <div className='max-w-md space-y-3'>
                  <div className='overflow-y-auto whitespace-pre-wrap px-1'>
                    {/* 字幕内容后续接入 */}
                  </div>
                </div>
              </div>
            </div>
          </ChatMessageView>

          {/* AgentTile 居中 */}
          <div className='fixed inset-0 z-20 flex items-center justify-center'>
            <LiteAgentTile state={agentState} className='h-64 w-96' />
          </div>

          {/* 底部：左本地视频 | 中录音指示器占位 | 右控制条 */}
          <div className='fixed inset-x-0 bottom-12 z-50 px-6'>
            <div className='flex w-full items-end gap-4'>
              <div className='min-w-[8rem] flex-1'>
                <LocalVideoTile stream={localStream ?? undefined} className='h-48 w-64 rounded-md overflow-hidden border bg-black' />
              </div>
              <div className='flex flex-1 justify-center -mb-10'>
                {/* 录音指示器（PlanB后续接入，无LiveKit） */}
              </div>
              <div className='flex flex-1 justify-end pointer-events-auto mb-4'>
                <LiteControlBar />
              </div>
            </div>
          </div>

          {/* 右下角：工具栏（相机/麦克/设备） */}
          <div className='fixed bottom-6 right-6 z-50'>
            <ToolbarLite
              cameraEnabled={cameraEnabled}
              micEnabled={micEnabled}
              cameraDeviceId={camDeviceId}
              micDeviceId={micDeviceId}
              onToggleCamera={setCameraEnabled}
              onToggleMic={setMicEnabled}
              onSelectCamera={setCamDeviceId}
              onSelectMic={setMicDeviceId}
            />
          </div>
        </div>
      </Main>
    </>
  )
}


