import { useEffect, useRef, useState, useCallback } from 'react'
import { Main } from '@/components/layout/main'
import { RoomAudioRenderer, RoomContext } from '@livekit/components-react'
import { RoomEvent, Room, type RemoteParticipant } from 'livekit-client'
// AgentControlBar moved into SessionView
import '@livekit/components-styles'
import { loadInterviewConnectionFromStorage, postNodeAction, NodeActionTrigger, useInterviewRecordStatus, type InterviewConnectionDetails, removeInterviewConnectionFromStorage } from '@/features/interview/api'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SessionView } from '@/features/interview/session-view'
import { getPreferredDeviceId } from '@/lib/devices'
import { markInterviewStart, reportInterviewDeviceInfo, reportInterviewConnected, reportRecordFail, reportWsConnectTimeout, reportWsReconnectTimeout, userEvent, reportRoomConnectError, reportSessionStay15s } from '@/lib/apm'
import { toast } from 'sonner'

interface InterviewPageProps {
  interviewId: string | number
  jobId?: string | number
  jobApplyId?: string | number
  interviewNodeId?: string | number
}

export default function InterviewPage({ interviewId, jobId, jobApplyId, interviewNodeId }: InterviewPageProps) {
  const navigate = useNavigate()

  // const identity = useMemo(() => `user-${Date.now()}`, [])
  const [data, setData] = useState<InterviewConnectionDetails | null>(() => loadInterviewConnectionFromStorage(interviewId))
  const isError = !data || !data.token || !data.serverUrl
  const roomRef = useRef<Room>(new Room())
  const hasEverConnectedRef = useRef(false)
  const navigatedRef = useRef(false)
  const endedRef = useRef(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  // 可配置的连接/重连超时（单位ms）
  const CONNECT_TIMEOUT_MS = Number((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_INTERVIEW_CONNECT_TIMEOUT_MS ?? 20_000)
  const RECONNECT_TIMEOUT_MS = Number((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_INTERVIEW_RECONNECT_TIMEOUT_MS ?? 15_000)
  const debugEnabled = Boolean(import.meta.env?.DEV)
  // 连接与重连超时计时器
  const connectStartAtRef = useRef<number | null>(null)
  const connectTimeoutRef = useRef<number | null>(null)
  const reconnectStartAtRef = useRef<number | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const startConnectTimeout = useCallback(() => {
    connectStartAtRef.current = performance.now()
    if (connectTimeoutRef.current) {
      try { clearTimeout(connectTimeoutRef.current) } catch { /* noop */ }
    }
    if (debugEnabled) {
      /* eslint-disable-next-line no-console */
      console.error('[Interview] startConnectTimeout', { timeoutMs: CONNECT_TIMEOUT_MS })
    }
    connectTimeoutRef.current = window.setTimeout(() => {
      const start = connectStartAtRef.current ?? performance.now()
      const cost = performance.now() - start
      if (debugEnabled) {
        /* eslint-disable-next-line no-console */
        console.error('[Interview] connect timeout fired', { cost })
      }
      toast.error('请检查网络，关闭VPN等代理工具', { position: 'top-center' })
      reportWsConnectTimeout(cost, { stage: 'initial', server: 'livekit' })
    }, Math.max(0, CONNECT_TIMEOUT_MS))
  }, [CONNECT_TIMEOUT_MS, debugEnabled])
  const stopConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      try { clearTimeout(connectTimeoutRef.current) } catch { /* noop */ }
    }
    if (debugEnabled) {
      /* eslint-disable-next-line no-console */
      console.error('[Interview] stopConnectTimeout')
    }
    connectTimeoutRef.current = null
    connectStartAtRef.current = null
  }, [debugEnabled])
  const startReconnectTimeout = useCallback(() => {
    reconnectStartAtRef.current = performance.now()
    if (reconnectTimeoutRef.current) {
      try { clearTimeout(reconnectTimeoutRef.current) } catch { /* noop */ }
    }
    if (debugEnabled) {
      /* eslint-disable-next-line no-console */
      console.error('[Interview] startReconnectTimeout', { timeoutMs: RECONNECT_TIMEOUT_MS })
    }
    reconnectTimeoutRef.current = window.setTimeout(() => {
      const start = reconnectStartAtRef.current ?? performance.now()
      const cost = performance.now() - start
      if (debugEnabled) {
        /* eslint-disable-next-line no-console */
        console.error('[Interview] reconnect timeout fired', { cost })
      }
      toast.error('请检查网络，关闭VPN等代理工具', { position: 'top-center' })
      reportWsReconnectTimeout(cost, { stage: 'reconnecting', server: 'livekit' })
    }, Math.max(0, RECONNECT_TIMEOUT_MS))
  }, [RECONNECT_TIMEOUT_MS, debugEnabled])
  const stopReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      try { clearTimeout(reconnectTimeoutRef.current) } catch { /* noop */ }
    }
    if (debugEnabled) {
      /* eslint-disable-next-line no-console */
      console.error('[Interview] stopReconnectTimeout')
    }
    reconnectTimeoutRef.current = null
    reconnectStartAtRef.current = null
  }, [debugEnabled])
  
  // 页面进入即标记 start（仅记录时间点，不触发上报）
  useEffect(() => {
    markInterviewStart()
  }, [])
  
  // Session页面停留15秒埋点
  useEffect(() => {
    const timer = setTimeout(() => {
      reportSessionStay15s()
    }, 15000) // 15秒
    
    return () => clearTimeout(timer)
  }, [])
  
  // 进入页面后再次尝试从存储读取（防止刷新后初始状态为 null）
  const hasLoadedDetailsRef = useRef(false)
  
  useEffect(() => {
    // 防止严格模式下重复执行
    if (hasLoadedDetailsRef.current) return
    
    const details = loadInterviewConnectionFromStorage(interviewId)
    if (details) {
      setData(details)
      hasLoadedDetailsRef.current = true
    } else {
      setData(null)
      let url = `/interview/prepare?data=job_id${jobId}andisSkipConfirmtrue&source=session_refresh`
      if (jobApplyId) url += `&job_apply_id=${jobApplyId}`
      navigate({ to: url, replace: true })
    }
  }, [])

  const performEndInterview = async () => {
    if (navigatedRef.current) return
    const interviewId = (data as { interviewId?: string | number } | undefined)?.interviewId
    endedRef.current = true
    navigatedRef.current = true
    // 提交当前节点结果，确保后端状态更新
    userEvent('interview_user_terminated', '用户主动中断面试', {
      job_id: jobId,
      interview_id: interviewId,
      job_apply_id: jobApplyId,
    })
    try {
      if (interviewNodeId) {
        // await postNodeAction({ node_id: interviewNodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
      }
    } catch { /* ignore */ }
    if (interviewId) {
      setTimeout(() => {
        const params = new URLSearchParams()
        const current = new URLSearchParams(window.location.search)
        params.set('interview_id', String(interviewId))
        if (jobId != null) params.set('job_id', String(jobId))
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

  useEffect(() => {
    if (!data?.token || !data?.serverUrl) return
    const room = roomRef.current
    const connect = async () => {
      try {
        if (endedRef.current) {
          // 已经结束，不再建立或恢复设备
          return
        }
        // 初次连接超时监控
        if (room.state === 'disconnected') {
          if (debugEnabled) {
            /* eslint-disable-next-line no-console */
            console.error('[Interview] initial connect begin')
          }
          startConnectTimeout()
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
        stopConnectTimeout()
        reportInterviewDeviceInfo({
          audioinput: room.localParticipant.activeDeviceMap.get('audioinput'),
          audiooutput: room.localParticipant.activeDeviceMap.get('audiooutput'),
          videoinput: room.localParticipant.activeDeviceMap.get('videoinput'),
          isMicrophoneEnabled: room.localParticipant.isMicrophoneEnabled, 
          lastCameraError: room.localParticipant.lastCameraError,
          lastMicrophoneError: room.localParticipant.lastMicrophoneError,
        })
      } catch (_e) {
        reportRoomConnectError(_e as Error)
        if (debugEnabled) {
          /* eslint-disable-next-line no-console */
          console.error('[Interview] initial connect error')
        }
      }
    }
    void connect()
    // no cleanup disconnect here; handled by dedicated handlers
  }, [data?.serverUrl, data?.token, startConnectTimeout, stopConnectTimeout, debugEnabled])

  // 获取录制状态（基于 connection_details 返回的 roomName）
  const roomName = (data as { roomName?: string } | undefined)?.roomName
  // 延迟 10s 后调用两次；默认不启用自动轮询
  const { data: recordStatus, refetch: refetchRecordStatus } = useInterviewRecordStatus(roomName, false, false)
  const reportedRecordFailRef = useRef(false)
  const reportedRecordStartedRef = useRef(false)
  
  useEffect(() => {
    if (!roomName) return
    const timer = setTimeout(() => {
      void refetchRecordStatus()
    }, 10_000)
    return () => {
      clearTimeout(timer)
    }
  }, [roomName, refetchRecordStatus])

  // 录制状态为 0（失败/未开始）时上报一次 APM 事件
  useEffect(() => {
    if (!roomName) return
    const status = typeof recordStatus?.status === 'number' ? recordStatus.status : undefined
    if (status === 0 && !reportedRecordFailRef.current) {
      reportedRecordFailRef.current = true
      reportRecordFail(roomName)
    } else if (typeof status === 'number' && status !== 0 && !reportedRecordStartedRef.current) {
      reportedRecordStartedRef.current = true
      userEvent('interview_recording_started', '面试录制成功开启', {
        job_id: jobId,
        interview_id: interviewId,
        job_apply_id: jobApplyId,
      })
    }
  }, [recordStatus?.status, roomName, jobId, interviewId, jobApplyId])

  // 面试断开或有参与者断开时，结束面试：跳转 finish 页面（replace），带上 interview_id
  useEffect(() => {
    const room = roomRef.current
    const handleDisconnected = async (_reason?: unknown) => {
      // 断开后立即释放本地设备与媒体轨道，尽快归还权限
      // try { await room.localParticipant.setMicrophoneEnabled(false) } catch { /* noop */ }
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
          userEvent('interview_completed', '面试正常结束', {
            job_id: jobId,
            interview_id: interviewId,
            job_apply_id: jobApplyId,
          })
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
      // try { await room.localParticipant.setMicrophoneEnabled(false) } catch { /* noop */ }
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
      if (debugEnabled) {
        /* eslint-disable-next-line no-console */
        console.error('[Interview] RoomEvent.Reconnecting')
      }
      startReconnectTimeout()
    }
    const handleReconnected = () => {
      if (debugEnabled) {
        /* eslint-disable-next-line no-console */
        console.error('[Interview] RoomEvent.Reconnected')
      }
      stopReconnectTimeout()
    }
    const handleConnChanged = () => {
      // Connection state changed logic if needed
    }
    const details = loadInterviewConnectionFromStorage(interviewId)
    if (details?.token && details?.serverUrl) { 
      room.on(RoomEvent.Disconnected, handleDisconnected)
      removeInterviewConnectionFromStorage(interviewId)
    }
    room.on(RoomEvent.Reconnecting, handleReconnecting)
    room.on(RoomEvent.Reconnected, handleReconnected)
    room.on(RoomEvent.ConnectionStateChanged, handleConnChanged)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    return () => {
      stopConnectTimeout()
      stopReconnectTimeout()
      room.off(RoomEvent.Disconnected, handleDisconnected)
      room.off(RoomEvent.Reconnecting, handleReconnecting)
      room.off(RoomEvent.Reconnected, handleReconnected)
      room.off(RoomEvent.ConnectionStateChanged, handleConnChanged)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    }
  }, [navigate, data, jobApplyId, interviewNodeId, jobId, startReconnectTimeout, stopReconnectTimeout, stopConnectTimeout, debugEnabled])

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
          {isError && (
            <div className='absolute inset-0 z-50 grid place-items-center'>
              <div className='text-sm text-primary'>未找到会话信息，请返回上一步重新进入。</div>
            </div>
          )}

          {data?.token ? (
            <div className='h-full'>
              <RoomContext.Provider value={roomRef.current}>
                <RoomAudioRenderer />
                <SessionView
                  disabled={false}
                  sessionStarted className='h-full'
                  onRequestEnd={() => setConfirmEndOpen(true)}
                  onDisconnect={performEndInterview}
                  recordingStatus={recordStatus?.status}
                  interviewId={data?.interviewId}
                  jobId={jobId}
                  jobApplyId={jobApplyId}
                />
              </RoomContext.Provider>
            </div>
          ) : (
            <div className='h-full'>
              <RoomContext.Provider value={roomRef.current}>
                <SessionView disabled={false} sessionStarted={false} className='h-full' jobId={jobId} jobApplyId={jobApplyId} />
              </RoomContext.Provider>
            </div>
          )}
        </div>
      </Main>
      <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-left'>
            <DialogTitle>确认要放弃面试吗？</DialogTitle>
            <DialogDescription>放弃面试将没有面试结果，若需要请重新面试</DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button onClick={() => setConfirmEndOpen(false)}>继续面试</Button>
            <Button variant='outline' onClick={() => {
              setConfirmEndOpen(false)
              performEndInterview()
            }}>确定放弃</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


