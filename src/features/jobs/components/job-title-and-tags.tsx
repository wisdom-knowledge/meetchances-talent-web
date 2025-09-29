import { IconBriefcase, IconWorldPin } from '@tabler/icons-react'
import type { ApiJob } from '@/features/jobs/api'

const salaryTypeMapping: Record<'hour' | 'month' | 'year', string> = {
  hour: '时',
  month: '月',
  year: '年',
}

export interface JobTitleAndTagsProps {
  job: ApiJob
}

export default function JobTitleAndTags({ job }: JobTitleAndTagsProps) {
  const key = (job.salary_type ?? 'hour') as 'hour' | 'month' | 'year'

  return (
    <>
      <div className='mb-2 truncate text-2xl leading-tight font-bold text-gray-900'>
        {job.title}
      </div>
      <div className='mb-2 flex flex-row items-center gap-2 text-[#4E02E4]'>
        {job.job_type !== 'mock_job' &&
          (<div className='mr-4 flex items-center justify-center'>
            <IconBriefcase className='mr-1 h-4 w-4' />
            <span className='text-[14px]'>
              {salaryTypeMapping[key]}薪制
            </span>
          </div>)
        }
        {job.job_type === 'part_time' && (
          <div className='flex items-center justify-center'>
            <IconWorldPin className='mr-1 h-4 w-4' />
            <span className='text-[14px]'>远程</span>
          </div>
        )}
      </div>
    </>
  )
}


