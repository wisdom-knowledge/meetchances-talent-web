import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
// import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
// import { Search } from '@/components/search'
// import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { ExploreJobs } from './mockData.ts'
import { useJobsQuery, useJobDetailQuery } from './api'
import { JobType } from '@/constants/explore'
import type { Job } from '@/types/solutions'
import { cn } from '@/lib/utils'
import { IconUserPlus } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
// import { useNavigate } from '@tanstack/react-router'
import JobDetailDrawer from './components/job-detail-drawer'
import { Skeleton } from '@/components/ui/skeleton'

export default function JobsListPage() {
  // const navigate = useNavigate()

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data: jobsData, isLoading } = useJobsQuery({ skip: 0, limit: 20 })
  const jobs = jobsData?.data ?? []

  // 当只拿到列表的精简数据时，点击后再拉详情
  const { data: detailData } = useJobDetailQuery(selectedJob?.id ?? null, isDrawerOpen)
  const selectedJobData = detailData ?? selectedJob

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    // 关闭后清理当前选中数据
    setSelectedJob(null)
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
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl mb-2'>职位列表</h1>
          <p className='text-muted-foreground'>寻找与你匹配的远程/合约职位</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='relative flex h-[calc(100vh-4rem)] flex-col gap-6 lg:flex-row -mb-8'>
          {/* 左侧：职位列表 */}
          <div className={cn('h-full lg:h-auto flex-1')}>
            <ScrollArea className='h-full pr-1'>
              <ul className='space-y-2'>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index: number) => (
                      <li key={`skeleton-${index}`}>
                        <div className='w-full rounded-md border p-4'>
                          <div className='flex items-center justify-between gap-4'>
                            <div className='min-w-0'>
                              <Skeleton className='mb-2 h-5 w-40' />
                              <Skeleton className='h-3 w-24' />
                            </div>
                            <div className='flex items-center gap-2'>
                              <Skeleton className='h-6 w-16' />
                              <Skeleton className='h-6 w-28' />
                              <Skeleton className='h-6 w-12' />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  : jobs.map((job: Job) => {
                   const isActive = selectedJob?.id === job.id
                  const referralBonus = job.referralBonus ?? 0
                  return (
                    <li key={job.id}>
                      <div
                        role='button'
                        tabIndex={0}
                        onClick={() => handleSelectJob(job)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleSelectJob(job)
                        }}
                        className={
                          'w-full cursor-pointer rounded-md border p-4 text-left transition-colors hover:bg-accent ' +
                          (isActive ? 'border-primary ring-primary/30' : 'border-border')
                        }
                      >
                        <div className='flex items-center justify-between gap-4'>
                          <div>
                            <h3 className='font-medium'>{job.title}</h3>
                             <p className='text-xs text-muted-foreground'>{job.company}</p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='emphasis'>
                              <IconUserPlus className='h-3.5 w-3.5' />
                               {referralBonus.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 })}
                            </Badge>
                            <Badge variant='outline'>
                              ￥{job.salaryRange?.[0] ?? 0} - ￥{job.salaryRange?.[1] ?? 0} / 小时
                            </Badge>
                            <Badge variant='emphasis'>
                              {job.jobType === JobType.PART_TIME ? '兼职' : '全职'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                  })}
              </ul>
            </ScrollArea>
          </div>
          {/* 职位详情：Drawer 展示 */}
          <JobDetailDrawer
            open={isDrawerOpen}
            job={selectedJobData ?? null}
            onOpenChange={(open) => (open ? setIsDrawerOpen(true) : handleCloseDrawer())}
            onBack={handleCloseDrawer}
          />
        </div>
      </Main>
    </>
  )
}

// const topNav = [
//   {
//     title: '职位列表',
//     href: '/jobs',
//     isActive: true,
//     disabled: false,
//   },
// ]


