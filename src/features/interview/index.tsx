import { useEffect, useRef, useState } from 'react'
import { Main } from '@/components/layout/main'
import { RoomAudioRenderer, RoomContext } from '@livekit/components-react'
import { RoomEvent, Room, type RemoteParticipant } from 'livekit-client'
import { AgentControlBar } from '@/components/livekit/agent-control-bar'  
import '@livekit/components-styles'
import { useInterviewConnectionDetails, postNodeAction, NodeActionTrigger } from '@/features/interview/api'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SessionView } from '@/features/interview/session-view'
import { getPreferredDeviceId } from '@/lib/devices'

interface InterviewPageProps {
  jobId: string | number
  jobApplyId?: string | number
  interviewNodeId?: string | number
}

export default function InterviewPage({ jobId, jobApplyId, interviewNodeId }: InterviewPageProps) {
  const navigate = useNavigate()

  // const identity = useMemo(() => `user-${Date.now()}`, [])
  const { data, isLoading, isError, refetch } = useInterviewConnectionDetails(jobId, true)
  const roomRef = useRef<Room>(new Room())
  const hasEverConnectedRef = useRef(false)
  const navigatedRef = useRef(false)
  const endedRef = useRef(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const performEndInterview = async () => {
    if (navigatedRef.current) return
    const interviewId = (data as { interviewId?: string | number } | undefined)?.interviewId
    endedRef.current = true
    navigatedRef.current = true
    if (interviewId) {
      setTimeout(() => {
        const params = new URLSearchParams()
        const current = new URLSearchParams(window.location.search)
        params.set('interview_id', String(interviewId))
        params.set('job_id', String(jobId))
        if (jobApplyId) params.set('job_apply_id', String(jobApplyId))
        if (interviewNodeId) params.set('interview_node_id', String(interviewNodeId))
        const invite = current.get('invite_token')
        if (invite) params.set('invite_token', invite)
        const skip = current.get('isSkipConfirm')
        if (skip) params.set('isSkipConfirm', skip)
        const dataStr = current.get('data')
        if (dataStr) params.set('data', dataStr)
        window.location.replace(`/finish?${params.toString()}`)
      }, 2000)
    } else {
      navigate({ to: '/finish', replace: true })
    }
  }

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
          const params = new URLSearchParams()
          const current = new URLSearchParams(window.location.search)
          params.set('interview_id', String(interviewId))
          params.set('job_id', String(jobId))
          if (jobApplyId) params.set('job_apply_id', String(jobApplyId))
          if (interviewNodeId) params.set('interview_node_id', String(interviewNodeId))
          const invite = current.get('invite_token')
          if (invite) params.set('invite_token', invite)
          const skip = current.get('isSkipConfirm')
          if (skip) params.set('isSkipConfirm', skip)
          const dataStr = current.get('data')
          if (dataStr) params.set('data', dataStr)
          window.location.replace(`/finish?${params.toString()}`)
        }, 2000)
      } else {
        const current = new URLSearchParams(window.location.search)
        navigate({
          to: '/finish',
          search: {
            job_id: jobId,
            job_apply_id: jobApplyId,
            interview_node_id: interviewNodeId,
            invite_token: current.get('invite_token') ?? undefined,
            isSkipConfirm: current.get('isSkipConfirm') ?? undefined,
            data: current.get('data') ?? undefined,
          } as unknown as Record<string, unknown>,
          replace: true,
        })
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
  }, [navigate, data, jobApplyId, interviewNodeId, jobId])

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
                <div className='pointer-events-none fixed bottom-32 left-1/2 z-50 -translate-x-1/2 transform w-[min(900px,90vw)]'>
                  <div className='pointer-events-auto'>
                    <AgentControlBar onRequestEnd={() => setConfirmEndOpen(true)} onDisconnect={performEndInterview} />
                  </div>
                </div>
              </RoomContext.Provider>
            </div>
          ) : (
            <div className='h-full'>
              <RoomContext.Provider value={roomRef.current}>
                <SessionView disabled={false} sessionStarted={false} className='h-full' />
              </RoomContext.Provider>
            </div>
          )}
        </div>
      </Main>
      <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-left'>
            <DialogTitle>确认要提前结束面试吗？</DialogTitle>
            <DialogDescription>提前结束面试将影响您的面试结果评估</DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button onClick={() => setConfirmEndOpen(false)}>继续面试</Button>
            <Button variant='outline' onClick={() => {
              setConfirmEndOpen(false)
              performEndInterview()
            }}>确定结束</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


