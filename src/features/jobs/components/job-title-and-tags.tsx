import { IconBriefcase, IconWorldPin } from '@tabler/icons-react'
import type { Job } from '@/types/solutions'
import { JobType } from '@/constants/explore'

const salaryTypeMapping: Record<Job['salaryType'], string> = {
  hour: '时',
  month: '月',
  year: '年',
}

export interface JobTitleAndTagsProps {
  job: Job
}

export default function JobTitleAndTags({ job }: JobTitleAndTagsProps) {
  return (
    <>
      <div className='mb-2 truncate text-2xl leading-tight font-bold text-gray-900'>
        {job.title}
      </div>
      <div className='mb-2 flex flex-row items-center gap-2 text-[#4E02E4]'>
        <div className='mr-4 flex items-center justify-center'>
          <IconBriefcase className='mr-1 h-4 w-4' />
          <span className='text-[14px]'>
            {salaryTypeMapping[job.salaryType]}薪制
          </span>
        </div>
        {job.jobType === JobType.PART_TIME && (
          <div className='flex items-center justify-center'>
            <IconWorldPin className='mr-1 h-4 w-4' />
            <span className='text-[14px]'>远程</span>
          </div>
        )}
      </div>
    </>
  )
}


