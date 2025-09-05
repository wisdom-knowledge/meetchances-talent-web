import { useEffect, useMemo, useRef, useState } from 'react'
import { Main } from '@/components/layout/main'
import { RoomAudioRenderer, RoomContext, useConnectionState, useRoomContext } from '@livekit/components-react'
import { LogLevel, RoomEvent, Room, setLogLevel, type RemoteParticipant } from 'livekit-client'
// import { AgentControlBar } from '@/components/livekit/agent-control-bar'  
import '@livekit/components-styles'
import { useInterviewConnectionDetails, postNodeAction, NodeActionTrigger } from '@/features/interview/api'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { SessionView } from '@/features/interview/session-view'
import { getPreferredDeviceId } from '@/lib/devices'

interface InterviewPageProps {
  jobId: string | number
  jobApplyId?: string | number
  interviewNodeId?: string | number
}

export default function InterviewPage({ jobId, jobApplyId, interviewNodeId }: InterviewPageProps) {
  const isDev = import.meta.env.DEV
  const navigate = useNavigate()

  const roomName = 'interview-room'
  const identity = useMemo(() => `user-${Date.now()}`, [])
  const { data, isLoading, isError, refetch } = useInterviewConnectionDetails(jobId, true)
  const roomRef = useRef<Room>(new Room())
  const hasEverConnectedRef = useRef(false)
  const navigatedRef = useRef(false)
  const endedRef = useRef(false)

  // 直接使用 URL 传入的 interview_node_id

  // 当拿到 token/serverUrl 时，连接房间；离开时断开
  useEffect(() => {
    if (!data?.token || !data?.serverUrl) return
    const room = roomRef.current
    // eslint-disable-next-line no-console
    console.log('[Interview] connect effect start', {
      hasToken: Boolean(data?.token),
      hasServerUrl: Boolean(data?.serverUrl),
      roomState: room.state,
    })
    const connect = async () => {
      try {
        if (endedRef.current) {
          // 已经结束，不再建立或恢复设备
          return
        }
        if (room.state === 'disconnected') {
          // eslint-disable-next-line no-console
          console.log('[Interview] connecting to livekit ...')
          await room.connect(data.serverUrl, data.token)
        }
        if (endedRef.current) return
        const prefMic = getPreferredDeviceId('audioinput') ?? undefined
        const prefCam = getPreferredDeviceId('videoinput') ?? undefined
        await room.localParticipant.setMicrophoneEnabled(true, { deviceId: prefMic })
        await room.localParticipant.setCameraEnabled(true, { deviceId: prefCam })
        hasEverConnectedRef.current = true
        // eslint-disable-next-line no-console
        console.log('[Interview] connected & devices enabled', {
          mic: prefMic ?? 'default',
          cam: prefCam ?? 'default',
        })
      } catch (_e) {
        /* ignore */
      }
    }
    void connect()
    // no cleanup disconnect here; handled by dedicated handlers
  }, [data?.serverUrl, data?.token])

  // 面试断开或有参与者断开时，结束面试：跳转 finish 页面（replace），带上 interview_id
  useEffect(() => {
    const room = roomRef.current
    const handleDisconnected = async (reason?: unknown) => {
      // eslint-disable-next-line no-console
      console.log('[Interview] Disconnected event', {
        reason: String(reason ?? 'unknown'),
        hasEverConnected: hasEverConnectedRef.current,
        alreadyNavigated: navigatedRef.current,
        roomState: room.state,
        visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
        online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
      })
      // 断开后立即释放本地设备与媒体轨道，尽快归还权限
      try { await room.localParticipant.setMicrophoneEnabled(false) } catch { /* noop */ }
      try { await room.localParticipant.setCameraEnabled(false) } catch { /* noop */ }
      room.localParticipant.getTrackPublications().forEach((pub) => {
        try {
          const track = pub.track
          if (track && (track.kind === 'audio' || track.kind === 'video')) {
            track.stop()
            // 取消发布交给 room 内部
            // eslint-disable-next-line no-console
            console.log(`停止 ${track.kind} 轨道: ${track.sid}`)
          }
        } catch { /* ignore */ }
      })
      endedRef.current = true
      if (!hasEverConnectedRef.current || navigatedRef.current) return
      navigatedRef.current = true
      const interviewId = (data as { interviewId?: string | number } | undefined)?.interviewId
      try {
        if (interviewNodeId) {
          await postNodeAction({ node_id: interviewNodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
        }
      } catch { /* ignore */ }
      if (interviewId) {
        setTimeout(() => {
          // TIPS： 这里使用原生API而非route跳转，因为这样可以低成本解决设备权限未被释放的问题
          window.location.replace(`/finish?interview_id=${interviewId}`)
          // navigate({ to: '/finish', search: { interview_id: interviewId } as unknown as Record<string, unknown>, replace: true })
        }, 2000)
      } else {
        navigate({ to: '/finish', replace: true })
      }
    }
    const handleParticipantDisconnected = async (participant?: RemoteParticipant) => {
      // eslint-disable-next-line no-console
      console.log('[Interview] ParticipantDisconnected', {
        identity: participant?.identity,
        sid: participant?.sid,
        isAgentGuess: typeof participant?.identity === 'string' && participant.identity.toLowerCase().includes('agent'),
        remoteParticipantCount: room.numParticipants,
        localIdentity: room.localParticipant.identity,
      })
      // 明确释放本地设备并断开，以触发统一的 Disconnected 处理
      try { await room.localParticipant.setMicrophoneEnabled(false) } catch { /* noop */ }
      try { await room.localParticipant.setCameraEnabled(false) } catch { /* noop */ }
      room.localParticipant.getTrackPublications().forEach((pub) => {
        try {
          const track = pub.track
          if (track && (track.kind === 'audio' || track.kind === 'video')) {
            track.stop()
            // eslint-disable-next-line no-console
            console.log(`停止 ${track.kind} 轨道: ${track.sid}`)
          }
        } catch { /* ignore */ }
      })
      endedRef.current = true
      try { await room.disconnect() } catch { /* noop */ }
      // Progress advance on interview end: submit current node
      try {
        if (interviewNodeId) {
          await postNodeAction({ node_id: interviewNodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
        }
      } catch { /* ignore */ }
      void handleDisconnected()
    }
    const handleReconnecting = () => {
      // eslint-disable-next-line no-console
      console.log('[Interview] Reconnecting ...', {
        visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
        online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
      })
    }
    const handleReconnected = () => {
      // eslint-disable-next-line no-console
      console.log('[Interview] Reconnected')
    }
    const handleConnChanged = () => {
      // eslint-disable-next-line no-console
      console.log('[Interview] ConnectionStateChanged', { state: room.state })
    }
    room.on(RoomEvent.Disconnected, handleDisconnected)
    room.on(RoomEvent.Reconnecting, handleReconnecting)
    room.on(RoomEvent.Reconnected, handleReconnected)
    room.on(RoomEvent.ConnectionStateChanged, handleConnChanged)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected)
      room.off(RoomEvent.Reconnecting, handleReconnecting)
      room.off(RoomEvent.Reconnected, handleReconnected)
      room.off(RoomEvent.ConnectionStateChanged, handleConnChanged)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    }
  }, [navigate, data, jobApplyId, interviewNodeId])

  // 记录页面可见性与网络状态，辅助定位生产环境切后台后的断开
  useEffect(() => {
    const room = roomRef.current
    const onVisibility = () => {
      // eslint-disable-next-line no-console
      console.log('[Interview] visibilitychange', {
        visibility: document.visibilityState,
        online: navigator.onLine,
        roomState: room.state,
      })
    }
    const onOnline = () => {
      // eslint-disable-next-line no-console
      console.log('[Interview] network online')
    }
    const onOffline = () => {
      // eslint-disable-next-line no-console
      console.log('[Interview] network offline')
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <>
      <Main>
        <div className='h-[80vh] relative'>
          {isLoading && (
            <div className='absolute inset-0 grid place-items-center text-sm text-muted-foreground'>正在连接面试房间…</div>
          )}
          {isError && (
            <div className='absolute inset-0 grid place-items-center'>
              <div className='flex items-center gap-3 text-sm text-red-600'>
                <span>获取房间令牌失败。</span>
                <Button size='sm' variant='outline' onClick={() => refetch()}>重试</Button>
              </div>
            </div>
          )}

          {data?.token ? (
            <div className='h-full'>
              <RoomContext.Provider value={roomRef.current}>
                <RoomAudioRenderer />
                <SessionView disabled={false} sessionStarted className='h-full' />
                <div className='pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform w-[min(900px,90vw)]'>
                  <div className='pointer-events-auto'>
                    {/* <AgentControlBar onDisconnect={() => {
                      if (navigatedRef.current) return
                      endedRef.current = true
                      navigatedRef.current = true
                      const interviewId = (data as { interviewId?: string | number } | undefined)?.interviewId
                      if (interviewId) {
                        setTimeout(() => {
                          // TIPS： 这里使用原生API而非route跳转，因为这样可以低成本解决设备权限未被释放的问题
                          window.location.replace(`/finish?interview_id=${interviewId}`)
                        }, 2000)
                      } else {
                        navigate({ to: '/finish', replace: true })
                      }
                    }} /> */}
                  </div>
                </div>
                {isDev && data?.token && (
                  <DebugLiveKitStatus roomName={roomName} identity={identity} token={data.token} />
                )}
              </RoomContext.Provider>
            </div>
          ) : (
            <>
              <div className='absolute inset-0 grid place-items-center text-sm text-muted-foreground'>
                <div className='text-center'>
                  <div className='text-base mb-2'>会话预览（未连接）</div>
                  <div className='text-xs'>接口未就绪，正在以占位模式展示页面布局</div>
                </div>
              </div>
              <RoomContext.Provider value={roomRef.current}>
                <SessionView disabled={false} sessionStarted={false} className='h-full' />
              </RoomContext.Provider>
              <div className='pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform w-[min(900px,90vw)]'>
                <div className='pointer-events-auto bg-background border flex flex-col rounded-[31px] border p-3 shadow'>
                  <div className='flex flex-row justify-between gap-1'>
                    <div className='flex gap-1'>
                      <Button type='button' size='sm' variant='outline' disabled className='w-auto pr-3 pl-3 md:rounded-r-none md:border-r-0 md:pr-2'>麦克风</Button>
                      <Button type='button' size='sm' variant='outline' disabled className='rounded-l-none'>选择麦克风</Button>
                      <Button type='button' size='sm' variant='outline' disabled className='w-auto rounded-r-none pr-3 pl-3 md:border-r-0 md:pr-2'>摄像头</Button>
                      <Button type='button' size='sm' variant='outline' disabled className='rounded-l-none'>选择摄像头</Button>
                      <Button type='button' size='sm' variant='outline' disabled className='w-auto'>共享屏幕</Button>
                      <Button type='button' size='sm' variant='outline' disabled className='h-full'>字幕</Button>
                    </div>
                    <Button variant='destructive' disabled className='font-mono'>结束</Button>
                  </div>
                </div>
              </div>
            </>
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


