import { useState, useMemo } from 'react'
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
import { useJobsQuery, useJobDetailQuery, type ApiJob, JobsSortBy, JobsSortOrder } from './api'
import { cn } from '@/lib/utils'
import { IconClockHour4, IconCurrencyYen } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
// import { useNavigate } from '@tanstack/react-router'
import JobDetailDrawer from './components/job-detail-drawer'
import { Skeleton } from '@/components/ui/skeleton'

function formatPublishTime(createdAt?: string): string {
  if (!createdAt) return ''
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return ''
  const diffMs = Date.now() - created
  if (diffMs < 0) return '刚刚发布'
  const hourMs = 1000 * 60 * 60
  const dayMs = hourMs * 24
  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs)
    return `${Math.max(hours, 1)}小时前发布`
  }
  const days = Math.floor(diffMs / dayMs)
  return `${Math.max(days, 1)}天前发布`
}

export default function JobsListPage() {
  // const navigate = useNavigate()

  const [selectedJob, setSelectedJob] = useState<ApiJob | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [sortBy, setSortBy] = useState<JobsSortBy>(JobsSortBy.PublishTime)
  const [sortOrder, setSortOrder] = useState<JobsSortOrder>(JobsSortOrder.Desc)

  const queryParams = useMemo(() => ({ skip: 0, limit: 20, sort_by: sortBy, sort_order: sortOrder }), [sortBy, sortOrder])
  const { data: jobsData, isLoading } = useJobsQuery(queryParams)
  const jobs = jobsData?.data ?? []

  // 当只拿到列表的精简数据时，点击后再拉详情
  const { data: detailData } = useJobDetailQuery(selectedJob?.id ?? null, isDrawerOpen)
  const selectedJobData = detailData ?? selectedJob

  const handleSelectJob = (job: ApiJob) => {
    setSelectedJob(job)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    // 关闭后清理当前选中数据
    setSelectedJob(null)
  }

  const isPublishActive = sortBy === JobsSortBy.PublishTime
  const isSalaryActive = sortBy === JobsSortBy.SalaryMax

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-0.5'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl mb-2'>职位列表</h1>
            <p className='text-muted-foreground'>寻找与你匹配的远程/合约职位</p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => {
                setSortBy(JobsSortBy.PublishTime)
                setSortOrder(JobsSortOrder.Desc)
              }}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 rounded-full px-4 text-sm border transition-colors',
                isPublishActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              )}
              aria-pressed={isPublishActive}
            >
              <IconClockHour4 className='h-4 w-4' /> 最新发布
            </button>
            <button
              type='button'
              onClick={() => {
                setSortBy(JobsSortBy.SalaryMax)
                setSortOrder(JobsSortOrder.Desc)
              }}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 rounded-full px-4 text-sm border transition-colors',
                isSalaryActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              )}
              aria-pressed={isSalaryActive}
            >
              <IconCurrencyYen className='h-4 w-4' /> 最高薪资
            </button>
          </div>
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
                  : jobs.map((job: ApiJob) => {
                   const isActive = selectedJob?.id === job.id
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
                             <p className='text-xs text-muted-foreground'>{formatPublishTime(job.created_at)}</p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline'>
                              ￥{job.salary_min ?? 0} - ￥{job.salary_max ?? 0} / 小时
                            </Badge>
                            <Badge variant='emphasis'>
                              {job.job_type === 'part_time' ? '兼职' : '全职'}
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


