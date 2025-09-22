import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { getRtcConnectionInfo as fetchRtcConnectionInfo } from '@/features/interview/api'
import { useRoomStore } from '@/stores/interview/room'
import { useJoin } from "../session-view-page/lib/useCommon";

export default function AntechamberPage() {
  const navigate = useNavigate()
  const setRtcConnectionInfo = useRoomStore((s) => s.setRtcConnectionInfo)
  const [joining, triggerJoin] = useJoin()
  const rtcInfo = useRoomStore((s) => s.rtcConnectionInfo)

  const loadRtcConnectionInfo = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search)
      // FIXME 暂时用4做兜底
      const jobIdStr = params.get('job_id') || "2"
      const jobId = jobIdStr ? Number(jobIdStr) : NaN
      if (!jobIdStr || Number.isNaN(jobId)) {
        toast.error('缺少或无效的 job_id 参数', { position: 'top-center' })
        return
      }
      const info = await fetchRtcConnectionInfo({ job_id: jobId })
      setRtcConnectionInfo(info)
      
    } catch (_e) {
      toast.error('获取面试连接信息失败，请稍后重试', { position: 'top-center' })
    }
  }, [setRtcConnectionInfo])

  useEffect(() => {
    // 每次页面初始化后
    void loadRtcConnectionInfo();
  }, [loadRtcConnectionInfo])

  const handleJoin = async () => {
    await triggerJoin()
    navigate({
      to: '/interview/session_view',
      search: {
        interview_id: rtcInfo?.interview_id,
        room_id: rtcInfo?.room_id,
      } as unknown as Record<string, unknown>,
    })
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>Antechamber</h1>
          <p className='text-muted-foreground'>进入新版面试间的入口</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='relative h-[60vh]'>
          <p>room_id:{ rtcInfo?.room_id }</p>
          <p>interview_id:{ rtcInfo?.interview_id }</p>
          <p>joining: {joining}</p>
          <p>typeof triggerJoin: {typeof triggerJoin}</p>
          <div className='absolute inset-0 flex items-center justify-center'>
            <Button
              size='lg'
              onClick={() => handleJoin()}
            >
              进入新版面试间
            </Button>
          </div>
        </div>
      </Main>
    </>
  )
}


