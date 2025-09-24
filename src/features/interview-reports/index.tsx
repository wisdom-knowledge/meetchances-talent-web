import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { IconArrowLeft } from '@tabler/icons-react'
import { AiInterviewSection } from './components/interview-record'
import { CandidateInfoCard } from './components/user-basic-info'
import { SharePoster } from './components/share-poster'
import { fetchInterviewReport } from './api'
import { useAuthStore } from '@/stores/authStore'

export default function InterviewReports() {
  const [showSharePoster, setShowSharePoster] = useState(false)
  const navigate = useNavigate()
  const search = useSearch({ from: '//_authenticated/interview-reports/' as any }) as { job_id?: number | string }
  const user = useAuthStore((s) => s.auth.user)

  const { data } = useQuery({
    queryKey: ['interview-report', user?.id, search?.job_id],
    queryFn: () => fetchInterviewReport({ talentId: user?.id, jobId: search?.job_id }),
    enabled: Boolean(user?.id) && Boolean(search?.job_id),
  })

  const report = useMemo(() => data ?? null, [data])
  const candidateName = report?.data?.applicant_brief?.replace(/的申请报告$/, '') || '候选人'
  const score = report?.data?.overall_score?.score || 0
  
  // 首次进入带 job_id 的报告时自动打开分享海报（记录到 localStorage，后续不再自动打开）
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const jobId = search?.job_id
      if (!jobId) return
      const idString = String(jobId)
      const STORAGE_KEY = 'mc:autoOpenSharePosterIds'
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const openedIds: string[] = raw ? (JSON.parse(raw) as string[]) : []
      if (!openedIds.includes(idString)) {
        setShowSharePoster(true)
        const next = [...openedIds, idString]
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
    } catch (_e) {
      // 忽略本地存储错误
    }
  }, [search?.job_id])

  // 计算面试时间
  const getInterviewDate = () => {
    const detailText = report?.data?.ai_interview?.detail_text
    if (!detailText || detailText.length === 0) return '--'
    
    const firstTimestamp = detailText[0]?.metadata?.ts
    if (!firstTimestamp) return '--'
    
    try {
      const dateObj = new Date(firstTimestamp)
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\//g, '-')
    } catch (_e) {
      return '--'
    }
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='overflow-y-auto' fixed>
        {/* 顶部返回按钮（独立一行） */}
        <div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back()
              } else {
                navigate({ to: '/mock-interview/records' })
              }
            }}
          >
            <IconArrowLeft className='h-4 w-4' /> 返回
          </Button>
        </div>
        <div className='flex items-center justify-between mt-[12px]'>
          <div className='space-y-0.5'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              面试报告
            </h1>
            <p className='text-muted-foreground mt-1'>查看详细的面试分析和评估结果</p>
          </div>
          
          {/* 生成海报按钮 */}
          <Button 
            onClick={() => setShowSharePoster(true)}
            className='gap-2'
          >
            <Share2 className='h-4 w-4' />
            生成分享海报
          </Button>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 页面主体内容 */}
        <div className='space-y-6'>
          {report ? <CandidateInfoCard data={report.data} /> : null}
          <AiInterviewSection
            data={report?.data?.ai_interview}
            videoUrl={report?.data?.resume_match.avatar_url || ''}
          />
        </div>
      </Main>

      {/* 分享海报弹窗 */}
      <SharePoster
        open={showSharePoster}
        onOpenChange={setShowSharePoster}
        candidateName={candidateName}
        score={score}
        jobName={report?.data?.poster_info?.jobName ?? ''}
        date={getInterviewDate()}
        posterInfo={report?.data?.poster_info}
        userName={report?.data?.poster_info?.name}
        interviewId={String(search?.job_id ?? '')}
      />
    </>
  )
}
