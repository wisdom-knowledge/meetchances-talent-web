import { useCallback, useState, useEffect, useRef } from 'react'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import InterviewTimer from './components/interview-timer'
import { ConnectionQualityBars } from '@/components/interview/connection-quality-bars'
import { ChatMessageView } from './components/chat-message-view'
import ConnectionStatus from './components/connection-status'
import LiteAgentTile from './components/lite-agent-tile'
import { Button } from '@/components/ui/button'
import LocalVideoTile from './components/local-video-tile'
import RecordingIndicator from './components/recording-indicator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLeave, useInterviewFinish } from './lib/useCommon'
import useAgentApm from './lib/useAgentApm'
import { userEvent } from '@/lib/apm'
import { useRoomStore } from '@/stores/interview/room'
import { useNavigate } from '@tanstack/react-router'

export default function InterviewSessionViewPage() {

  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const leaveRoom = useLeave()
  useInterviewFinish()
  useAgentApm()
  const navigate = useNavigate()
  const performEndInterview = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const jobId = params.get('job_id') ?? undefined
      const jobApplyId = params.get('job_apply_id') ?? undefined
      const storeInterviewId = useRoomStore.getState().rtcConnectionInfo?.interview_id
      const interviewId = storeInterviewId ?? params.get('interview_id') ?? undefined
      userEvent('interview_user_terminated', '用户主动中断面试', {
        job_id: jobId,
        interview_id: interviewId,
        job_apply_id: jobApplyId,
      })
    } catch { /* ignore */ }

    await leaveRoom()
    setTimeout(() => {
      window.location.replace('/finish')
    }, 1000)
  }, [leaveRoom])

  const onLeave = useCallback(() => {
    setConfirmEndOpen(true)
  }, [])

  useEffect(() => {
    return () => {
      console.log('use effect >>> leave room')
      leaveRoom()
    }
  }, [])

  // 判断是否为刷新的逻辑
  // 进入页面后再次尝试从存储读取（防止刷新后初始状态为 null）
  const hasLoadedDetailsRef = useRef(false)
  useEffect(() => {
    // 防止严格模式下重复执行
    if (hasLoadedDetailsRef.current) return
    const interviewId = new URLSearchParams(window.location.search).get('interview_id')
    const jobId = new URLSearchParams(window.location.search).get('job_id')
    const jobApplyId = new URLSearchParams(window.location.search).get('job_apply_id')
    const details = localStorage.getItem(`rtc_connection_info:v1:${interviewId}`)

    if (details) {
      hasLoadedDetailsRef.current = true
      localStorage.removeItem(`rtc_connection_info:v1:${interviewId}`)
    } else {
      let url = `/interview/prepare?data=job_id${jobId}andisSkipConfirmtrue&source=session_refresh`
      if (jobApplyId) url += `&job_apply_id=${jobApplyId}`
      navigate({ to: url, replace: true })
    }
  }, [])


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
          <ChatMessageView className='fixed inset-0 z-40' >
            <ConnectionStatus />
          </ChatMessageView>


          {/* AgentTile 居中 */}
          <div className='fixed inset-0 z-20 flex items-center justify-center'>
            <LiteAgentTile className='h-64 w-96' />
          </div>

          {/* 底部：左本地视频 | 中录音指示器占位 | 右控制条 */}
          <div className='fixed inset-x-0 bottom-12 z-50 px-6'>
            <div className='flex w-full items-end gap-4'>
              <div className='min-w-[8rem] flex-1'>
                <LocalVideoTile className='h-48 w-64 rounded-md overflow-hidden border bg-black' />
              </div>
              <div className='flex flex-1 justify-center -mb-10'>
                <RecordingIndicator />
              </div>
              <div className='flex flex-1 justify-end pointer-events-auto mb-4'>
                <div className={`flex flex-col rounded-[31px]`}>
                  <div className='flex flex-row justify-end gap-1'>
                    <Button variant='default' onClick={onLeave} className='font-mono'>放弃面试</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

