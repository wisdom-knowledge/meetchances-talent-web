import { useEffect, useMemo, useState } from 'react'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { LiveKitRoom, RoomAudioRenderer, StartAudio, useConnectionState, useRoomContext } from '@livekit/components-react'
import { LogLevel, RoomEvent, setLogLevel } from 'livekit-client'
import { AgentControlBar } from '@/components/livekit/agent-control-bar'
import { ConnectionStatus } from '@/components/interview/connection-status'
import { InterviewTimer } from '@/components/interview/interview-timer'
import { RecordingIndicator } from '@/components/interview/recording-indicator'
import '@livekit/components-styles'

export default function InterviewPage() {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isDev = import.meta.env.DEV

  const roomName = 'interview-room'
  const identity = useMemo(() => `user-${Date.now()}`, [])

  useEffect(() => {
    let isCancelled = false
    const fetchToken = async () => {
      try {
        const response = await fetch('http://localhost:3001/get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, identity }),
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.status}`)
        }
        const data: { token?: string } = await response.json()
        if (!isCancelled) {
          if (data?.token) setToken(data.token)
          else setError('未获取到有效的房间令牌（token）')
        }
      } catch (_err) {
        if (!isCancelled) setError('获取房间令牌失败，请稍后重试。')
      }
    }
    fetchToken()
    return () => {
      isCancelled = true
    }
  }, [identity])

  return (
    <>
      <Main>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>在线面试</h1>
          <p className='text-muted-foreground'>加入 LiveKit 面试房间，开始实时视频面试。</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='space-y-6'>
          {!token && !error && <div>正在连接面试房间…</div>}
          {error && (
            <div className='text-red-600 text-sm'>
              {error}
            </div>
          )}

          {token && (
            <div className='h-[80vh]'>
              <LiveKitRoom
                video
                audio
                token={token}
                serverUrl={import.meta.env.VITE_LIVEKIT_URL}
                data-lk-theme='default'
                style={{ height: '100%' }}
              >
                <RoomAudioRenderer />
                <StartAudio label='开启音频' />
                {/* 顶部状态与计时器 */}
                <div className='pointer-events-none fixed top-20 left-6 z-50'>
                  <ConnectionStatus />
                </div>
                <div className='pointer-events-none fixed top-20 right-6 z-50'>
                  <InterviewTimer active />
                </div>

                {/* 底部控制条 */}
                <div className='pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform w-[min(900px,90vw)]'>
                  <div className='pointer-events-auto'>
                    <AgentControlBar />
                  </div>
                </div>

                {/* 录音指示器 */}
                <div className='pointer-events-none fixed bottom-6 right-6 z-50'>
                  <RecordingIndicator micTrackRef={undefined} />
                </div>
                {isDev && (
                  <DebugLiveKitStatus roomName={roomName} identity={identity} token={token} />
                )}
              </LiveKitRoom>
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

interface DebugProps {
  roomName: string
  identity: string
  token: string
}

function DebugLiveKitStatus({ roomName, identity, token }: DebugProps) {
  const room = useRoomContext()
  const connState = useConnectionState()
  const [disconnectReason, setDisconnectReason] = useState<string | null>(null)

  useEffect(() => {
    setLogLevel(LogLevel.debug)
  }, [])

  useEffect(() => {
    if (!room) return
    const handleDisconnected = (reason?: unknown) => {
      setDisconnectReason(String(reason ?? 'unknown'))
    }
    room.on(RoomEvent.Disconnected, handleDisconnected)
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected)
    }
  }, [room])

  return (
    <div className='mt-2 rounded-md border p-2 text-xs text-muted-foreground bg-background/60'>
      <div>Connection: {String(connState)}</div>
      {disconnectReason && <div>Reason: {disconnectReason}</div>}
      <div>Server: {import.meta.env.VITE_LIVEKIT_URL}</div>
      <div>Room: {roomName}</div>
      <div>Identity: {identity}</div>
      <div>Token: {token.slice(0, 16)}...</div>
    </div>
  )
}


