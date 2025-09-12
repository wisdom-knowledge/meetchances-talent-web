import { useState, useMemo } from 'react'
import { IconClockHour4, IconCurrencyYen } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
// import { Search } from '@/components/search'
// import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import moneySvg from '@/assets/images/money.svg'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
// import { TopNav } from '@/components/layout/top-nav'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
 
// import { ExploreJobs } from './mockData.ts'
import {
  useJobsQuery,
  useJobDetailQuery,
  type ApiJob,
  JobsSortBy,
  JobsSortOrder,
} from './api'
// import { useNavigate } from '@tanstack/react-router'
import JobDetailDrawer from './components/job-detail-drawer'

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

  const queryParams = useMemo(
    () => ({ skip: 0, limit: 20, sort_by: sortBy, sort_order: sortOrder }),
    [sortBy, sortOrder]
  )
  const { data: jobsData, isLoading } = useJobsQuery(queryParams)
  const jobs = jobsData?.data ?? []

  // 当只拿到列表的精简数据时，点击后再拉详情
  const { data: detailData } = useJobDetailQuery(
    selectedJob?.id ?? null,
    isDrawerOpen
  )
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
        </div>
      </Header>

      <Main fixed>
        <div className='mx-auto w-full max-w-[1224px]'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-0.5'>
            <h1 className='mb-2 text-2xl font-bold tracking-tight md:text-3xl'>
              职位列表
            </h1>
            <p className='text-muted-foreground text-sm sm:text-base'>寻找与你匹配的工作机会</p>
          </div>
          <div className='hidden items-center gap-2 sm:flex'>
            <button
              type='button'
              onClick={() => {
                setSortBy(JobsSortBy.PublishTime)
                setSortOrder(JobsSortOrder.Desc)
              }}
              className={cn(
                'inline-flex h-8 sm:h-9 items-center gap-1 sm:gap-1.5 rounded-full border px-3 sm:px-4 text-xs sm:text-sm transition-colors',
                isPublishActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              )}
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
                'inline-flex h-8 sm:h-9 items-center gap-1 sm:gap-1.5 rounded-full border px-3 sm:px-4 text-xs sm:text-sm transition-colors',
                isSalaryActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              )}
            >
              <IconCurrencyYen className='h-4 w-4' /> 最高薪资
            </button>
          </div>
        </div>
        {/* 移动端 Tabs：放在标题和描述下方，仅小屏显示 */}
        <div className='sm:hidden mt-2'>
          <Tabs
            value={isPublishActive ? 'publish' : 'salary'}
            onValueChange={(v) => {
              if (v === 'publish') {
                setSortBy(JobsSortBy.PublishTime)
                setSortOrder(JobsSortOrder.Desc)
              } else {
                setSortBy(JobsSortBy.SalaryMax)
                setSortOrder(JobsSortOrder.Desc)
              }
            }}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='publish' className='text-xs h-8'><IconClockHour4 className='h-4 w-4' />最新发布</TabsTrigger>
              <TabsTrigger value='salary' className='text-xs h-8'><IconCurrencyYen className='h-4 w-4' />最高薪资</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='relative -mb-8 flex h-[calc(100vh-12rem)] flex-col gap-6 lg:flex-row'>
          {/* 左侧：职位列表 */}
          <div className='flex-1'>
            <ScrollArea className='h-[calc(100vh-12rem)] pr-1'>
              <ul className='space-y-2 pb-4'>
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
                  : [...jobs].map((job: ApiJob) => {
                      const isActive = selectedJob?.id === job.id
                      return (
                        <li key={job.id}>
                          <div
                            role='button'
                            tabIndex={0}
                            onClick={() => handleSelectJob(job)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ')
                                handleSelectJob(job)
                            }}
                            className={
                              'hover:bg-accent w-full cursor-pointer rounded-md border p-4 text-left transition-colors ' +
                              (isActive
                                ? 'border-primary ring-primary/30'
                                : 'border-border')
                            }
                          >
                            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4'>
                              <div>
                                <h3 className='font-medium'>{job.title}</h3>
                                <p className='text-muted-foreground text-xs'>
                                  {formatPublishTime(job.created_at)}
                                </p>
                              </div>
                              <div className='mt-2 sm:mt-0 flex items-center gap-2 sm:justify-end'>
                                <Badge variant='outline' className='rounded-full py-1.5 px-4 gap-1.5 text-primary'>
                                  <img src={moneySvg} alt='' className='h-4 w-4' aria-hidden='true' />
                                  ¥{job.salary_min ?? 0} - ¥{job.salary_max ?? 0} / 小时
                                </Badge>
                                
                                <Badge variant='default' className='rounded-full px-6 py-1.5 bg-[#C994F7] text-white'>
                                  {job.job_type === 'part_time'
                                    ? '兼职'
                                    : '全职'}
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
            onOpenChange={(open) =>
              open ? setIsDrawerOpen(true) : handleCloseDrawer()
            }
            onBack={handleCloseDrawer}
          />
        </div>
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
