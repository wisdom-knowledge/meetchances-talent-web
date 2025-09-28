import { useState, useMemo, useEffect } from 'react'
import { IconClockHour4, IconCurrencyYen, IconSearch } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
// import { Search } from '@/components/search'
// import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { mapCurrentNodeStatusToPill } from '@/utils/apply-pill'
import moneySvg from '@/assets/images/money.svg'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
// import { TopNav } from '@/components/layout/top-nav'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { userEvent } from '@/lib/apm'
import { useNavigate, useRouterState } from '@tanstack/react-router'

// import { ExploreJobs } from './mockData.ts'
import {
  useJobsQuery,
  useJobDetailQuery,
  type ApiJob,
  JobsSortBy,
  JobsSortOrder,
  useJobApplyStatus,
  JobApplyStatus,
} from './api'
// import { useNavigate } from '@tanstack/react-router'
import JobDetailDrawer from './components/job-detail-drawer'
import { Input } from '@/components/ui/input'

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
  const navigate = useNavigate()
  const { location } = useRouterState()
  const search = location.search as Record<string, unknown>

  const jobIdFromUrl = useMemo(() => {
    const v = search?.job_id
    if (typeof v === 'string') {
      const n = Number(v)
      return Number.isNaN(n) ? v : n
    }
    if (typeof v === 'number') return v
    return null
  }, [search])

  const [selectedJob, setSelectedJob] = useState<ApiJob | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(jobIdFromUrl)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(Boolean(jobIdFromUrl))

  const [sortBy, setSortBy] = useState<JobsSortBy>(JobsSortBy.PublishTime)
  const [sortOrder, setSortOrder] = useState<JobsSortOrder>(JobsSortOrder.Desc)

  const queryParams = useMemo(
    () => ({ skip: 0, limit: 20, sort_by: sortBy, sort_order: sortOrder }),
    [sortBy, sortOrder]
  )
  const { data: jobsData, isLoading } = useJobsQuery(queryParams)
  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData])
  // 串行：在拿到 jobs 后再请求申请状态
  const jobIds = useMemo(() => jobs.map((j) => j.id), [jobs])
  const { data: applyStatusMap } = useJobApplyStatus(jobIds, Boolean(jobIds.length))

  // 当只拿到列表的精简数据时，点击后再拉详情
  const effectiveSelectedId = selectedJobId ?? selectedJob?.id ?? null
  const { data: detailData } = useJobDetailQuery(effectiveSelectedId, isDrawerOpen)
  const selectedJobData = detailData ?? selectedJob

  const handleSelectJob = (job: ApiJob) => {
    setSelectedJob(job)
    setSelectedJobId(job.id)
    setIsDrawerOpen(true)
    userEvent('position_item_clicked', '点击岗位列表项', { job_id: job.id })
    navigate({
      to: location.pathname,
      search: (prev) => ({ ...(prev as Record<string, unknown>), job_id: job.id }),
    })
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedJob(null)
    setSelectedJobId(null)
    // 从 URL 移除 job_id
    navigate({
      to: location.pathname,
      search: (prev) => {
        const { job_id: _omit, ...rest } = (prev || {}) as Record<string, unknown>
        return rest
      },
    })
  }

  // 当 URL 中存在 job_id 时，进入页面后自动展开并同步本地状态
  useEffect(() => {
    if (jobIdFromUrl) {
      setIsDrawerOpen(true)
      setSelectedJobId(jobIdFromUrl)
    } else {
      setIsDrawerOpen(false)
      setSelectedJobId(null)
      setSelectedJob(null)
    }
  }, [jobIdFromUrl])

  // 当列表加载后，如果 URL 有 job_id 但本地还没选中具体 Job，则尝试从列表中填充
  useEffect(() => {
    if (jobIdFromUrl && !selectedJob) {
      const found = jobs.find((j) => String(j.id) === String(jobIdFromUrl))
      if (found) setSelectedJob(found)
    }
  }, [jobIdFromUrl, jobs, selectedJob])

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
          
        </div>
        <div className='mt-2 w-full flex items-center gap-2'>
          <div className='relative flex-1'>
            <Input placeholder='搜索职位' className='rounded-full pr-9 placeholder:text-sm' />
            <IconSearch aria-hidden='true' className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
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
                      const isActive = String(selectedJobId ?? selectedJob?.id ?? '') === String(job.id)
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
                                <h3 className='font-medium inline-flex items-center gap-2'>
                                  {job.title}
                                  <Badge
                                    className='inline-flex items-center justify-center px-2 py-1 text-[10px] leading-[10px] tracking-[0.25px] font-medium text-[#4E02E4] bg-[#4E02E40D] rounded'
                                  >
                                    {job.job_type === 'part_time' ? '兼职' : '全职'}
                                  </Badge>
                                </h3>
                                <p className='text-muted-foreground text-xs'>
                                  {formatPublishTime(job.created_at)}
                                </p>
                              </div>
                              <div className='mt-2 sm:mt-0 flex items-center gap-2 sm:justify-end'>
                                {(() => {
                                  const statusItem = applyStatusMap?.[String(job.id)]
                                  if (!statusItem || statusItem.job_apply_status !== JobApplyStatus.Applied) return null
                                  const pill = mapCurrentNodeStatusToPill(statusItem.current_node_status, statusItem.progress, statusItem.total_step)
                                  return (
                                    <span className={
                                      'inline-flex w-28 items-center justify-center py-1 gap-2 rounded-full leading-[1.6] tracking-[0.35px] text-xs ' +
                                      pill.classes
                                    }>
                                      {pill.text}
                                    </span>
                                  )
                                })()}
                                <Badge variant='outline' className='rounded-full py-1.5 px-4 gap-1.5 text-primary font-normal'>
                                  <img src={moneySvg} alt='' className='h-4 w-4' aria-hidden='true' />
                                  ¥{job.salary_min ?? 0} - ¥{job.salary_max ?? 0} / 小时
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
