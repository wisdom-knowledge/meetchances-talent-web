import { useCallback, useState, useEffect, useRef } from 'react'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLeave, useInterviewFinish } from './lib/useCommon'
import useAgentApm from './lib/useAgentApm'
import { userEvent } from '@/lib/apm'
import { useRoomStore } from '@/stores/interview/room'
import { useNavigate } from '@tanstack/react-router'
import { useJobDetailQuery } from '@/features/jobs/api'
import { useIsMobile } from '@/hooks/use-mobile'
import DesktopLayout from './components/desktop-layout'
import MobileLayout from './components/mobile-layout'
import useSilenceAutoHandle from './lib/useSilenceAutoHandle'

export default function InterviewSessionViewPage() {
  const isMobile = useIsMobile()
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const leaveRoom = useLeave()
  useInterviewFinish()
  useAgentApm()
  const navigate = useNavigate()

  // 获取job详情来判断是否为模拟面试
  const params = new URLSearchParams(window.location.search)
  const jobId = params.get('job_id')
  const { data: jobDetail } = useJobDetailQuery(jobId, Boolean(jobId))
  const performEndInterview = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const jobId = params.get('job_id') ?? undefined
      const jobApplyId = params.get('job_apply_id') ?? undefined
      const storeInterviewId = useRoomStore.getState().rtcConnectionInfo?.interview_id
      const interviewId = storeInterviewId ?? params.get('interview_id') ?? undefined
      userEvent('interview_user_terminated', '用户主动中断面试', {
        job_id: jobId,
        is_mock: jobDetail?.job_type === 'mock_job',
        interview_id: interviewId,
        job_apply_id: jobApplyId,
      })
      if (storeInterviewId != null) params.set('interview_id', String(storeInterviewId))
    } catch { /* ignore */ }

    await leaveRoom()
    setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search)
        const storeInterviewId = useRoomStore.getState().rtcConnectionInfo?.interview_id
        if (storeInterviewId != null) params.set('interview_id', String(storeInterviewId))
        // 从job详情判断是否为模拟面试
        if (jobDetail?.job_type === 'mock_job') params.set('is_canceled', 'true')
        window.location.replace(`/finish?${params.toString()}`)
      } catch {
        window.location.replace('/finish')
      }
    }, 1000)
  }, [leaveRoom, jobDetail])

  const onLeave = useCallback(() => {
    setConfirmEndOpen(true)
  }, [])

  useEffect(() => {
    return () => {
      console.log('use effect >>> leave room')
      leaveRoom()
      userEvent('interview_user_terminated_by_effect', 'effect触发的用户离开面试间', {})
    }
  }, [])

  // 判断是否为刷新的逻辑
  // 进入页面后再次尝试从存储读取（防止刷新后初始状态为 null）
  const hasLoadedDetailsRef = useRef(false)
  useEffect(() => {
    // 防止严格模式下重复执行
    if (hasLoadedDetailsRef.current) return
    const params = new URLSearchParams(window.location.search)
    const interviewId = params.get('interview_id')
    const jobId = params.get('job_id')
    const jobApplyId = params.get('job_apply_id')
    const details = localStorage.getItem(`rtc_connection_info:v1:${interviewId}`)

    if (details) {
      hasLoadedDetailsRef.current = true
      localStorage.removeItem(`rtc_connection_info:v1:${interviewId}`)
    } else {
      // 构建完整的重定向URL，保留所有重要参数
      let url = `/interview/prepare?data=job_id${jobId}andisSkipConfirmtrue&source=session_refresh`
      if (jobApplyId) url += `&job_apply_id=${jobApplyId}`
      navigate({ to: url, replace: true })
    }
  }, [jobDetail, navigate])

  // 静默检测：10 秒未说话先播放提示，再次 10 秒结束面试
  useSilenceAutoHandle({
    onEndInterview: () => {
      void performEndInterview()
    },
  })


  return (
    <>
      {isMobile ? (
        <>
          <MobileLayout onLeave={onLeave} />
          <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader className='text-left'>
                <DialogTitle>确认要放弃面试吗？</DialogTitle>
                <DialogDescription>放弃面试将没有面试结果，若需要请重新面试</DialogDescription>
              </DialogHeader>
              <DialogFooter className='gap-2'>
                <Button onClick={() => setConfirmEndOpen(false)}>继续面试</Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setConfirmEndOpen(false)
                    performEndInterview()
                  }}
                >
                  确定放弃
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <Main fixed>
            <Separator className='my-4 lg:my-6' />
            <DesktopLayout onLeave={onLeave} />
          </Main>
          <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader className='text-left'>
                <DialogTitle>确认要放弃面试吗？</DialogTitle>
                <DialogDescription>放弃面试将没有面试结果，若需要请重新面试</DialogDescription>
              </DialogHeader>
              <DialogFooter className='gap-2'>
                <Button onClick={() => setConfirmEndOpen(false)}>继续面试</Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setConfirmEndOpen(false)
                    performEndInterview()
                  }}
                >
                  确定放弃
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}

