import { useState, useMemo, useEffect, useRef } from 'react'
import { IconClockHour4, IconCurrencyYen, IconSearch } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
// import { Search } from '@/components/search'
// import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { mapCurrentNodeStatusToPill } from '@/utils/apply-pill'
import moneySvg from '@/assets/images/money.svg'
import giftSvg from './images/gift.svg'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useWeChatShare } from '@/hooks/use-wechat-share'
import { ProfileDropdown } from '@/components/profile-dropdown'
// import { TopNav } from '@/components/layout/top-nav'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { userEvent } from '@/lib/apm'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { fetchTalentMe } from '@/lib/api'

// import { ExploreJobs } from './mockData.ts'
import {
  useJobsQuery,
  useInfiniteJobsQuery,
  useJobDetailQuery,
  type ApiJob,
  JobsSortBy,
  JobsSortOrder,
  useJobApplyStatus,
  JobApplyStatus,
} from './api'
import { jobTypeMapping, salaryTypeUnitMapping } from './constants'
// import { useNavigate } from '@tanstack/react-router'
import JobDetailDrawer from './components/job-detail-drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import searchPng from '@/assets/images/search.png'

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
  const env = useRuntimeEnv()
  const navigate = useNavigate()
  const { location } = useRouterState()
  const search = location.search as Record<string, unknown>
  const { auth } = useAuthStore()

  // 获取当前用户信息（包含 referral_code）
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchTalentMe,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(auth.user),
  })

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
  const [keyword, setKeyword] = useState<string>('')
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const pageSize = 20
  const isInfiniteMode = env === 'mobile' || env === 'wechat-miniprogram'

  // 300ms 防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300)
    return () => clearTimeout(t)
  }, [keyword])

  // 搜索与排序变更时回到第一页（桌面分页模式）
  useEffect(() => {
    if (!isInfiniteMode) setPage(0)
  }, [debouncedKeyword, sortBy, sortOrder, isInfiniteMode])

  const queryParams = useMemo(
    () => ({ skip: page * pageSize, limit: pageSize, sort_by: sortBy, sort_order: sortOrder, title: debouncedKeyword || undefined }),
    [sortBy, sortOrder, debouncedKeyword, page]
  )
  // 数据源：根据模式切换
  const { data: jobsData, isLoading: isLoadingPaged } = useJobsQuery(queryParams, { enabled: !isInfiniteMode })
  const {
    data: infiniteData,
    isLoading: isLoadingInfinite,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteJobsQuery(
    { limit: pageSize, sort_by: sortBy, sort_order: sortOrder, title: debouncedKeyword || undefined },
    { enabled: isInfiniteMode }
  )

  const jobs: ApiJob[] = useMemo(() => {
    if (isInfiniteMode) {
      const pages: Array<{ data: ApiJob[]; total?: number }> = infiniteData?.pages ?? []
      const all = pages.flatMap((p: { data: ApiJob[] }) => p.data || [])
      return all
    }
    return jobsData?.data ?? []
  }, [isInfiniteMode, infiniteData, jobsData])

  const total = isInfiniteMode ? (infiniteData?.pages?.[0]?.total ?? 0) : (jobsData?.total ?? 0)
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize))
  const canPrev = page > 0
  const canNext = total ? page + 1 < pageCount : jobs.length === pageSize
  // 串行：在拿到 jobs 后再请求申请状态
  const jobIds = useMemo(() => jobs.map((j) => j.id), [jobs])
  const { data: applyStatusMap } = useJobApplyStatus(jobIds, Boolean(jobIds.length))

  // 当只拿到列表的精简数据时，点击后再拉详情
  const effectiveSelectedId = selectedJobId ?? selectedJob?.id ?? null
  const { data: detailData } = useJobDetailQuery(effectiveSelectedId, isDrawerOpen)
  const selectedJobData = detailData ?? selectedJob

  // 使用微信分享Hook
  useWeChatShare({
    shareTitle: selectedJobData ? `【招聘】${selectedJobData.title}` : '',
    shareDesc: selectedJobData
      ? `Meehchances/一面千识 | ${jobTypeMapping[selectedJobData.job_type as keyof typeof jobTypeMapping] || '工作'}丨${selectedJobData.salary_max && selectedJobData.salary_max > 0 ? `${selectedJobData.salary_min}-${selectedJobData.salary_max}` : selectedJobData.salary_min}/${salaryTypeUnitMapping[selectedJobData.salary_type as keyof typeof salaryTypeUnitMapping] || 'Meehchances/一面千识'}`
      : '',
    shareImgUrl:
      'https://dnu-cdn.xpertiise.com/common/42eabd48-d3c6-492e-b0f0-49b7dfe4419f.png',
    enabled: !!selectedJobData, // 只有当岗位信息加载完成后才启用分享
    // debug: false, // 生产环境关闭调试
  })

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

  // 处理内推标签点击
  const handleReferralClick = async (job: ApiJob, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止冒泡，避免触发职位选择
    
    // 检查登录状态
    if (!auth.user) {
      // 未登录，跳转到 OAuth 授权页面
      const loginUrl = import.meta.env.VITE_AUTH_LOGIN_URL
      if (loginUrl) {
        window.location.href = loginUrl
      }
      return
    }

    // 从用户信息中获取邀请码
    const referralCode = currentUser?.referral_code

    if (!referralCode) {
      toast.error('邀请码尚未加载，请稍后重试')
      return
    }

    // 复制邀请码到剪贴板
    try {
      await navigator.clipboard.writeText(referralCode)
      toast.success('邀请码已复制到剪贴板')
      userEvent('referral_code_copied', '复制邀请码', { job_id: job.id })
    } catch (_error) {
      toast.error('复制失败，请稍后重试')
    }
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

  // 移动端/小程序：滚动加载（IntersectionObserver 观察列表尾部）
  const listContainerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isInfiniteMode) return
    const sentinel = loadMoreSentinelRef.current
    const rootEl = listContainerRef.current
    if (!sentinel || !rootEl) return

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        root: rootEl,
        rootMargin: '0px 0px 200px 0px',
        threshold: 0.1,
      }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [isInfiniteMode, fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='md:mx-16 py-0'>
        <div className='mx-auto w-full h-full'>
        <div className='flex items-start justify-between gap-3'>
          <div className=' flex items-end'>
            <h1 className=' text-xl font-bold tracking-tight md:text-2xl mr-3'>
              职位列表
            </h1>
            <p className='text-muted-foreground text-sm sm:text-base relative '>寻找与你匹配的工作机会</p>
          </div>

        </div>
        <div className='md:mt-[12px] mt-[8px] w-full flex items-center gap-2 md:mb-[12px] mb-[8px]'>
          <div className='relative flex-1'>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='搜索职位'
              className='rounded-full pr-16 placeholder:text-sm'
            />
            {keyword ? (
              <button
                type='button'
                onClick={() => setKeyword('')}
                aria-label='清空搜索'
                className='absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-muted-foreground hover:bg-accent flex items-center justify-center'
              >
                <span className='text-lg leading-none'>&times;</span>
              </button>
            ) : null}
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
        <div className='sm:hidden mt-2 mb-[8px]'>
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

        <div className='relative -mb-8 flex md:h-[calc(100vh-10rem)] h-[calc(100vh-12rem)] flex-col gap-6 lg:flex-row'>
          {/* 左侧：职位列表 */}
          <div className='flex-1 flex flex-col min-h-0'>
            {isInfiniteMode ? (
              <div ref={listContainerRef} className='flex-1 min-h-0 md:h-[calc(100vh-10rem)] h-[calc(100vh-12rem)] pr-1 overflow-auto'>
                <ul className='space-y-2 pb-4'>
                  {(isLoadingInfinite && jobs.length === 0)
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
                    : jobs.length === 0 ? (
                      <li>
                        <div className='w-full py-16 text-center'>
                          <div className='mx-auto mb-4 h-16 w-16 opacity-80'>
                            <img src={searchPng} alt='' className='h-16 w-16 mx-auto' aria-hidden='true' />
                          </div>
                          <h3 className='text-base font-semibold'>未找到相关职位</h3>
                          <p className='text-muted-foreground text-sm mt-1'>试试调整关键词{keyword ? '，或清空搜索' : ''}</p>
                          {keyword ? (
                            <div className='mt-4'>
                              <Button size='sm' variant='secondary' onClick={() => setKeyword('')}>清空搜索</Button>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ) : ([...jobs].map((job: ApiJob) => {
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
                                </h3>
                                <p className='text-muted-foreground text-xs'>
                                  {formatPublishTime(job.created_at)}
                                </p>
                              </div>
                              <div className='mt-2 sm:mt-0 flex flex-wrap items-center gap-2 sm:justify-end'>
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
                                {typeof job.referral_bonus === 'number' && job.referral_bonus > 0 && (
                                  <Badge
                                    variant='outline'
                                    className='py-1.5 px-3 gap-1.5 text-white border-0 font-normal cursor-pointer hover:opacity-90 transition-opacity shrink-0'
                                    style={{ 
                                      borderRadius: '16px',
                                      background: 'linear-gradient(90deg, #27CDF1 0%, #C994F7 100%)'
                                    }}
                                    onClick={(e) => handleReferralClick(job, e)}
                                  >
                                    <img src={giftSvg} alt='' className='h-4 w-4' aria-hidden='true' />
                                    内推奖 ¥{job.referral_bonus}
                                  </Badge>
                                )}
                                <Badge variant='outline' className='rounded-full py-1.5 px-4 gap-1.5 text-primary font-normal shrink-0'>
                                  <img src={moneySvg} alt='' className='h-4 w-4' aria-hidden='true' />
                                  {job.salary_max && job.salary_max > 0 
                                    ? `¥${job.salary_min ?? 0} - ¥${job.salary_max} / ${salaryTypeUnitMapping[job.salary_type as keyof typeof salaryTypeUnitMapping] || '小时'}`
                                    : `¥${job.salary_min ?? 0} / ${salaryTypeUnitMapping[job.salary_type as keyof typeof salaryTypeUnitMapping] || '小时'}`
                                  }
                                </Badge>
                                 <Badge
                                     className='inline-flex items-center justify-center px-2 py-1 font-normal tracking-[0.25px] text-[#4E02E4] bg-[#4E02E40D] rounded shrink-0'
                                   >
                                     {jobTypeMapping[job.job_type as keyof typeof jobTypeMapping] || ''}
                                 </Badge>
                              </div>
                            </div>
                            </div>
                          </li>
                        )
                      }))}
                </ul>
                {/* Sentinel & footer states */}
                <div ref={loadMoreSentinelRef} className='h-6' />
                <div className='pb-4 text-center text-xs text-muted-foreground mb-24'>
                  {isFetchingNextPage ? '加载中…' : hasNextPage ? '向下滚动加载更多' : jobs.length > 0 ? '没有更多了' : ''}
                </div>
              </div>
            ) : (
            <ScrollArea className='flex-1 min-h-0 md:h-[calc(100vh-10rem)] h-[calc(100vh-12rem)] pr-1'>
              <ul className='space-y-2 pb-4'>
                {isLoadingPaged
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
                  : jobs.length === 0 ? (
                    <li>
                      <div className='w-full py-16 text-center'>
                        <div className='mx-auto mb-4 h-16 w-16 opacity-80'>
                          <img src={searchPng} alt='' className='h-16 w-16 mx-auto' aria-hidden='true' />
                        </div>
                        <h3 className='text-base font-semibold'>未找到相关职位</h3>
                        <p className='text-muted-foreground text-sm mt-1'>试试调整关键词{keyword ? '，或清空搜索' : ''}</p>
                        {keyword ? (
                          <div className='mt-4'>
                            <Button size='sm' variant='secondary' onClick={() => setKeyword('')}>清空搜索</Button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ) : ([...jobs].map((job: ApiJob) => {
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
                                </h3>
                                <p className='text-muted-foreground text-xs'>
                                  {formatPublishTime(job.created_at)}
                                </p>
                              </div>
                              <div className='mt-2 sm:mt-0 flex flex-wrap items-center gap-2 sm:justify-end'>
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
                                {typeof job.referral_bonus === 'number' && job.referral_bonus > 0 && (
                                  <Badge
                                    variant='outline'
                                    className='py-1.5 px-3 gap-1.5 text-white border-0 font-normal cursor-pointer hover:opacity-90 transition-opacity shrink-0'
                                    style={{ 
                                      borderRadius: '16px',
                                      background: 'linear-gradient(90deg, #27CDF1 0%, #C994F7 100%)'
                                    }}
                                    onClick={(e) => handleReferralClick(job, e)}
                                  >
                                    <img src={giftSvg} alt='' className='h-4 w-4' aria-hidden='true' />
                                    内推奖 ¥{job.referral_bonus}
                                  </Badge>
                                )}
                                <Badge variant='outline' className='rounded-full py-1.5 px-4 gap-1.5 text-primary font-normal shrink-0'>
                                  <img src={moneySvg} alt='' className='h-4 w-4' aria-hidden='true' />
                                  {job.salary_max && job.salary_max > 0 
                                    ? `¥${job.salary_min ?? 0} - ¥${job.salary_max} / ${salaryTypeUnitMapping[job.salary_type as keyof typeof salaryTypeUnitMapping] || '小时'}`
                                    : `¥${job.salary_min ?? 0} / ${salaryTypeUnitMapping[job.salary_type as keyof typeof salaryTypeUnitMapping] || '小时'}`
                                  }
                                </Badge>
                                 <Badge
                                     className='inline-flex items-center justify-center px-2 py-1 font-normal tracking-[0.25px] text-[#4E02E4] bg-[#4E02E40D] rounded shrink-0'
                                   >
                                     {jobTypeMapping[job.job_type as keyof typeof jobTypeMapping] || ''}
                                 </Badge>
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    }))}
              </ul>
            </ScrollArea>
            )}
            {/* 分页控制：固定在列表下方可见（仅桌面显示） */}
            {!isInfiniteMode && (
            <div className={cn('flex items-center justify-end gap-2 pt-2')}> 
              <button
                type='button'
                className={cn('inline-flex h-8 items-center rounded-md border px-3 text-xs', !canPrev && 'opacity-50 cursor-not-allowed')}
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                上一页
              </button>
              <div className='text-muted-foreground text-xs'>第 {page + 1} / {pageCount} 页</div>
              <button
                type='button'
                className={cn('inline-flex h-8 items-center rounded-md border px-3 text-xs', !canNext && 'opacity-50 cursor-not-allowed')}
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </button>
            </div>
            )}
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
