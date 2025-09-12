import { useEffect, useRef, useState } from 'react'
import { Main } from '@/components/layout/main'
import { RoomAudioRenderer, RoomContext } from '@livekit/components-react'
import { RoomEvent, Room, type RemoteParticipant } from 'livekit-client'
// AgentControlBar moved into SessionView
import '@livekit/components-styles'
import { useInterviewConnectionDetails, postNodeAction, NodeActionTrigger, useInterviewRecordStatus } from '@/features/interview/api'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SessionView } from '@/features/interview/session-view'
import { getPreferredDeviceId } from '@/lib/devices'
import { markInterviewStart, reportInterviewConnected } from '@/lib/apm'
import { toast } from 'sonner'

interface InterviewPageProps {
  jobId: string | number
  jobApplyId?: string | number
  interviewNodeId?: string | number
}

export default function InterviewPage({ jobId, jobApplyId, interviewNodeId }: InterviewPageProps) {
  const navigate = useNavigate()

  // const identity = useMemo(() => `user-${Date.now()}`, [])
  const { data, isLoading, isError, error } = useInterviewConnectionDetails(jobId, true)
  const roomRef = useRef<Room>(new Room())
  const hasEverConnectedRef = useRef(false)
  const navigatedRef = useRef(false)
  const endedRef = useRef(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  
  // 页面进入即标记 start（仅记录时间点，不触发上报）
  useEffect(() => {
    markInterviewStart()
  }, [])
  
  // 发生错误时使用 toast 提示
  useEffect(() => {
    if (!isError) return
    const maybe = error as { status_code?: number; status_msg?: string } | undefined
    const code = maybe?.status_code
    if (code === 100001) {
      // 屏幕中心展示，不使用 toast
      return
    }
    toast.error('网络不给力，请稍后再试~')
  }, [isError, error])
  const performEndInterview = async () => {
    if (navigatedRef.current) return
    const interviewId = (data as { interviewId?: string | number } | undefined)?.interviewId
    endedRef.current = true
    navigatedRef.current = true
    // 提交当前节点结果，确保后端状态更新
    try {
      if (interviewNodeId) {
        await postNodeAction({ node_id: interviewNodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
      }
    } catch { /* ignore */ }
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
      }, 1000)
    } else {
      navigate({ to: '/finish', replace: true })
    }
  }

  // 直接使用 URL 传入的 interview_node_id

  // 当拿到 token/serverUrl 时，连接房间；离开时断开
  useEffect(() => {
    if (!data?.token || !data?.serverUrl) return
    const room = roomRef.current
    const connect = async () => {
      try {
        if (endedRef.current) {
          // 已经结束，不再建立或恢复设备
          return
        }
        if (room.state === 'disconnected') {
          await room.connect(data.serverUrl, data.token)
        }
        if (endedRef.current) return
        const prefMic = getPreferredDeviceId('audioinput')
        const prefCam = getPreferredDeviceId('videoinput')
        // 只有在设备ID不是 'default' 时才传递具体的设备ID
        const micDeviceId = prefMic && prefMic !== 'default' ? prefMic : undefined
        const camDeviceId = prefCam && prefCam !== 'default' ? prefCam : undefined
        await room.localParticipant.setMicrophoneEnabled(true, {
          deviceId: micDeviceId,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        })
        await room.localParticipant.setCameraEnabled(true, { deviceId: camDeviceId })
        hasEverConnectedRef.current = true
        // 上报“连接耗时”指标（连接成功 = connect + 设备启用成功）
        reportInterviewConnected({ server: 'livekit' })
      } catch (_e) {
        /* ignore */
      }
    }
    void connect()
    // no cleanup disconnect here; handled by dedicated handlers
  }, [data?.serverUrl, data?.token])

  // 获取录制状态（基于 connection_details 返回的 roomName）
  const roomName = (data as { roomName?: string } | undefined)?.roomName
  // 延迟 10s 后调用两次；默认不启用自动轮询
  const { data: recordStatus, refetch: refetchRecordStatus } = useInterviewRecordStatus(roomName, false, false)
  useEffect(() => {
    if (!roomName) return
    const timer = setTimeout(() => {
      void refetchRecordStatus()
      // 第二次调用稍作间隔，确保两次请求均发送
      const timer2 = setTimeout(() => { void refetchRecordStatus() }, 600)
      // 清理第二个定时器
      ;(timer2 as unknown as { __cleanup?: boolean }).__cleanup = true
    }, 10_000)
    return () => {
      clearTimeout(timer)
    }
  }, [roomName, refetchRecordStatus])

  // 面试断开或有参与者断开时，结束面试：跳转 finish 页面（replace），带上 interview_id
  useEffect(() => {
    const room = roomRef.current
    const handleDisconnected = async (_reason?: unknown) => {
      // 断开后立即释放本地设备与媒体轨道，尽快归还权限
      try { await room.localParticipant.setMicrophoneEnabled(false) } catch { /* noop */ }
      try { await room.localParticipant.setCameraEnabled(false) } catch { /* noop */ }
      room.localParticipant.getTrackPublications().forEach((pub) => {
        try {
          const track = pub.track
          if (track && (track.kind === 'audio' || track.kind === 'video')) {
            track.stop()
            // 取消发布交给 room 内部
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
        }, 1000)
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
    const handleParticipantDisconnected = async (_participant?: RemoteParticipant) => {
      // 明确释放本地设备并断开，以触发统一的 Disconnected 处理
      try { await room.localParticipant.setMicrophoneEnabled(false) } catch { /* noop */ }
      try { await room.localParticipant.setCameraEnabled(false) } catch { /* noop */ }
      room.localParticipant.getTrackPublications().forEach((pub) => {
        try {
          const track = pub.track
          if (track && (track.kind === 'audio' || track.kind === 'video')) {
            track.stop()
          }
        } catch { /* ignore */ }
      })
      endedRef.current = true
      try { await room.disconnect() } catch { /* noop */ }
      void handleDisconnected()
    }
    const handleReconnecting = () => {
      // Reconnecting logic if needed
    }
    const handleReconnected = () => {
      // Reconnected logic if needed
    }
    const handleConnChanged = () => {
      // Connection state changed logic if needed
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
    const onVisibility = () => {
      // Visibility change logic if needed
    }
    const onOnline = () => {
      // Network online logic if needed
    }
    const onOffline = () => {
      // Network offline logic if needed
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
      <Main className='bg-[#F1E3FD]'>
        <div className='h-[80vh] relative bg-[#F1E3FD]'>
          {isLoading && (
            <div className='absolute inset-0 grid place-items-center text-sm text-muted-foreground'>正在连接面试房间…</div>
          )}
          {isError && (
            <div className='absolute inset-0 z-50 grid place-items-center'>
              {((error as { status_code?: number } | undefined)?.status_code === 100001) ? (
                <div className='text-sm text-primary'>抱歉，现在面试过于火爆，请15分钟后再试，我们期待与您结识。</div>
              ) : (
                <>  </>
              )}
            </div>
          )}

          {data?.token ? (
            <div className='h-full'>
              <RoomContext.Provider value={roomRef.current}>
                <RoomAudioRenderer />
                <SessionView disabled={false} sessionStarted className='h-full' onRequestEnd={() => setConfirmEndOpen(true)} onDisconnect={performEndInterview} recordingStatus={recordStatus?.status} />
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


