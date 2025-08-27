import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Job } from '@/types/solutions'
import { useAuthStore } from '@/stores/authStore'
import { useJobDetailQuery } from '@/features/jobs/api'
import JobDetailContent from '../jobs/components/job-detail-content'
import { useInviteInfoQuery } from './api'

export default function JobDetailPage() {
  const navigate = useNavigate()
  const setInviteInfo = useAuthStore((s) => s.auth.setInviteInfo)
  const [job, setJob] = useState<Job | null>(null)

  // 读取 URL 中的 invite_token 参数
  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('invite_token') ?? ''
  }, [])

  useEffect(() => {
    if (!inviteToken) {
      navigate({ to: '/home' })
    }
  }, [inviteToken, navigate])

  // 拉取邀请信息，拿到 job_id
  const { data: inviteInfo } = useInviteInfoQuery(
    inviteToken ? { token: inviteToken } : null
  )

  useEffect(() => {
    if (!inviteInfo) return
    setInviteInfo(inviteInfo)
  }, [inviteInfo, setInviteInfo])

  const jobId = inviteInfo?.job_id ?? null

  // 根据 job_id 拉取岗位详情
  const { data: jobDetail } = useJobDetailQuery(jobId, Boolean(jobId))

  useEffect(() => {
    if (jobDetail) setJob(jobDetail)
  }, [jobDetail])

  return (
    <div className='mr-[24px] ml-[24px] h-full'>
      {job ? (
        <JobDetailContent
          job={job}
          inviteToken={inviteToken}
          recommendName={inviteInfo?.headhunter_name}
        />
      ) : (
        <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
          正在加载...
        </div>
      )}
    </div>
  )
}
