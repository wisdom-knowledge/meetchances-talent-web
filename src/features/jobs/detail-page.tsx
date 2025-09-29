import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { ApiJob } from '@/features/jobs/api'
import { useJobDetailQuery } from '@/features/jobs/api'
import JobDetailContent from '@/features/jobs/components/job-detail-content'
import { Main } from '@/components/layout/main'

export interface JobsDetailPageProps {
  jobId: string
}

export default function JobsDetailPage({ jobId }: JobsDetailPageProps) {
  const navigate = useNavigate()
  const numericJobId = useMemo(() => {
    const n = Number(jobId)
    return Number.isNaN(n) ? jobId : n
  }, [jobId])

  const { data: jobDetail, isLoading } = useJobDetailQuery(numericJobId, Boolean(jobId))
  const [job, setJob] = useState<ApiJob | null>(null)

  useEffect(() => {
    if (jobDetail) setJob(jobDetail)
  }, [jobDetail])

  return (
    <>
      <Main fixed>
        <div className='w-full md:px-5'>
          <div className='mx-auto w-full md:w-[85vw] lg:w-[60vw] xl:w-[50vw]'>
            {job ? (
              <JobDetailContent
                job={job}
                onBack={() => navigate({ to: '/mock-interview', search: { page: 1, pageSize: 9, q: '', category: "0" } })}
                recommendName={''}
                isTwoColumn={false}
                backLabel='更多岗位'
                applyButtonText='开始面试'
              />
            ) : (
              <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>
                {isLoading ? '正在加载...' : '未找到该岗位'}
              </div>
            )}
          </div>
        </div>
      </Main>
    </>
  )
}


