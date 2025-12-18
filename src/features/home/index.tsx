import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { IconX, IconHelp, IconInfoCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import noApplySvg from '@/assets/images/no-apply.svg'
import emptyTopPng from '@/assets/images/empty-top.png'
import { salaryTypeUnitMapping } from '@/features/jobs/constants'
import {
  useImportantTasksQuery,
  useMyApplicationsQuery,
  useInfiniteMyApplicationsQuery,
  useMyProjectsQuery,
  useInfiniteMyProjectsQuery,
  type ApiApplyListItem,
  type ProjectListItem,
} from './api'
import { useTopProjectsQuery, type TopProjectItem } from './api'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'

export default function HomeViewPage() {
  const env = useRuntimeEnv()
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const authUser = useAuthStore((s) => s.auth.user)
  const displayName = authUser?.full_name || authUser?.username || ''
  const { data: taskList = [], isLoading: loadingTasks } =
    useImportantTasksQuery()
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const visibleTasks = taskList.filter((t) => !dismissed[t.id])

  // 从 URL 参数读取当前 tab
  const currentTab = (search as { tab?: string })?.tab === 'projects' ? 'projects' : 'applications'

  const [page, setPage] = useState(0)
  const pageSize = 10
  const [appsOnlineStatusFilter, setAppsOnlineStatusFilter] = useState<'all' | '10' | '20' | '0'>('all')
  const [projectsStatusFilter, setProjectsStatusFilter] = useState<'all' | '0' | '1'>('all')
  const isInfiniteMode = env === 'mobile' || env === 'wechat-miniprogram'
  const appsContainerRef = useRef<HTMLDivElement | null>(null)
  const appsSentinelRef = useRef<HTMLDivElement | null>(null)
  const projectsContainerRef = useRef<HTMLDivElement | null>(null)
  const projectsSentinelRef = useRef<HTMLDivElement | null>(null)

  const onlineStatusParam =
    appsOnlineStatusFilter === 'all' ? undefined : Number(appsOnlineStatusFilter)
  const projectsStatusParam =
    projectsStatusFilter === 'all' ? undefined : Number(projectsStatusFilter)

  const { data: appsData, isLoading: loadingAppsPaged } = useMyApplicationsQuery(
    { skip: page * pageSize, limit: pageSize, online_status: onlineStatusParam },
    { enabled: !isInfiniteMode }
  )

  // 置顶项目
  const { data: topProjects = [], isLoading: loadingTop } = useTopProjectsQuery()
  const topProject = topProjects[0]
  const hasTopProject = !loadingTop && Boolean(topProject) && topProject?.is_pinned === true
  const topProjectId = hasTopProject ? topProject?.id : undefined
  const [pinnedTooltipOpen, setPinnedTooltipOpen] = useState(false)
  const [endTimeTooltipOpen, setEndTimeTooltipOpen] = useState(false)

  useEffect(() => {
    // 切换置顶项目时收起 tooltip，避免状态残留
    setPinnedTooltipOpen(false)
    setEndTimeTooltipOpen(false)
  }, [topProjectId])
  const {
    data: infiniteApps,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMyApplicationsQuery(
    { limit: pageSize, online_status: onlineStatusParam },
    { enabled: isInfiniteMode }
  )

  const applications: ApiApplyListItem[] = useMemo(() => {
    if (isInfiniteMode) {
      const pages = infiniteApps?.pages ?? []
      return pages.flatMap((p) => (p.data ?? [])) as ApiApplyListItem[]
    }
    return ((appsData?.data ?? []) as ApiApplyListItem[])
  }, [isInfiniteMode, infiniteApps, appsData])

  const total = isInfiniteMode ? (infiniteApps?.pages?.[0]?.total ?? 0) : (appsData?.total ?? 0)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 0
  const canNext = page + 1 < pageCount

  // 项目列表数据
  const { data: projectsData, isLoading: loadingProjectsPaged } = useMyProjectsQuery(
    { skip: page * pageSize, limit: pageSize, status: projectsStatusParam },
    { enabled: !isInfiniteMode }
  )
  const {
    data: infiniteProjects,
    fetchNextPage: fetchNextProjectPage,
    hasNextPage: hasNextProjectPage,
    isFetchingNextPage: isFetchingNextProjectPage,
  } = useInfiniteMyProjectsQuery(
    { limit: pageSize, status: projectsStatusParam },
    { enabled: isInfiniteMode }
  )

  const projects: ProjectListItem[] = useMemo(() => {
    if (isInfiniteMode) {
      const pages = infiniteProjects?.pages ?? []
      return pages.flatMap((p) => (p.data ?? [])) as ProjectListItem[]
    }
    return ((projectsData?.data ?? []) as ProjectListItem[])
  }, [isInfiniteMode, infiniteProjects, projectsData])

  const projectsTotal = isInfiniteMode ? (infiniteProjects?.pages?.[0]?.total ?? 0) : (projectsData?.total ?? 0)
  const projectsPageCount = Math.max(1, Math.ceil(projectsTotal / pageSize))

  // 移动端/小程序：监听"我的申请"列表底部以加载下一页
  useEffect(() => {
    if (!isInfiniteMode) return
    const rootEl = appsContainerRef.current
    const sentinel = appsSentinelRef.current
    if (!rootEl || !sentinel) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: rootEl, rootMargin: '0px 0px 200px 0px', threshold: 0.1 }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [isInfiniteMode, hasNextPage, isFetchingNextPage, fetchNextPage])

  // 移动端/小程序：监听"项目"列表底部以加载下一页
  useEffect(() => {
    if (!isInfiniteMode) return
    const rootEl = projectsContainerRef.current
    const sentinel = projectsSentinelRef.current
    if (!rootEl || !sentinel) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (e.isIntersecting && hasNextProjectPage && !isFetchingNextProjectPage) {
          fetchNextProjectPage()
        }
      },
      { root: rootEl, rootMargin: '0px 0px 200px 0px', threshold: 0.1 }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [isInfiniteMode, hasNextProjectPage, isFetchingNextProjectPage, fetchNextProjectPage])

  const [helpOpen, setHelpOpen] = useState(false)
  const handleHelp = () => setHelpOpen(true)
  const pinnedCount = Math.min(topProjects.length, 1)
  const importantTasksCount =
    loadingTasks || loadingTop ? '…' : visibleTasks.length + pinnedCount
  const shouldShowImportantTasks =
    loadingTasks || loadingTop || visibleTasks.length > 0 || pinnedCount > 0

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='md:mx-16 py-0 mb-4'>
        <div className='md:flex md:items-end'>
          <h1 className='text-xl font-bold tracking-tight md:text-2xl mr-3'>
            欢迎回来{displayName ? `，${displayName}` : ''}
          </h1>
          <p className='text-muted-foreground'>查看你的任务与申请进度</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 重要任务 */}
        {shouldShowImportantTasks && (
          <div className='mb-6'>
            <div className='text-foreground mb-3 text-[15px] font-medium'>
              重要任务（{importantTasksCount}）
            </div>
            {loadingTasks || loadingTop ? (
              <Skeleton className='h-[104px] w-[300px] rounded-md' />
            ) : (
              <div className='space-y-3'>
                {visibleTasks.map((task) => (
                  task.id === 'guide' ? (
                    <div
                      key={task.id}
                      className='relative w-full rounded-lg bg-[#4E02E41A] px-4 py-3 pr-10'
                    >
                      {task.closable !== false && (
                        <button
                          aria-label='close'
                          className='text-muted-foreground hover:bg-accent absolute right-2 top-1/2 -translate-y-1/2 rounded p-1'
                          onClick={() =>
                            setDismissed((s) => ({ ...s, [task.id]: true }))
                          }
                        >
                          <IconX className='h-4 w-4' />
                        </button>
                      )}
                      <div className='flex items-center justify-between gap-4'>
                        <div className='min-w-0 text-[13px] md:text-sm text-[#37227A]'>
                          在使用平台前，请查看我们的一面千识用户手册！
                        </div>
                        <Button
                          size='sm'
                          onClick={task.handleClick}
                          className='bg-[#6F3CEE] text-white hover:bg-[#5F33CC]'
                        >
                          {task.actionText ?? '去查看'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Card
                      key={task.id}
                      className='relative w-[300px] border p-4 shadow-sm'
                    >
                      {task.closable !== false && (
                        <button
                          aria-label='close'
                          className='text-muted-foreground hover:bg-accent absolute top-2 right-2 rounded p-1'
                          onClick={() =>
                            setDismissed((s) => ({ ...s, [task.id]: true }))
                          }
                        >
                          <IconX className='h-4 w-4' />
                        </button>
                      )}
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 font-medium'>{task.title}</div>
                        {task.description && (
                          <div className='text-muted-foreground mb-3 text-sm'>
                            {task.description}
                          </div>
                        )}
                        <Button
                          size='sm'
                          onClick={task.handleClick}
                          className='float-right'
                        >
                          {task.actionText ?? '去查看'}
                        </Button>
                      </div>
                    </Card>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* 置顶项目 */}
        <div className='mb-6'>
          {loadingTop ? (
            <Skeleton className='h-[88px] w-full rounded-md' />
          ) : topProjects.length > 0 ? (
            topProjects.slice(0, 1).map((proj: TopProjectItem) => {
              const minutes = typeof proj.estimated_duration === 'number' ? Math.round(proj.estimated_duration) : undefined
              const fmt = (ts?: number) => {
                if (!ts) return undefined
                const d = new Date(ts * 1000)
                const y = d.getFullYear()
                const m = String(d.getMonth() + 1).padStart(2, '0')
                const da = String(d.getDate()).padStart(2, '0')
                return `${y}/${m}/${da}`
              }
              return (
                <Card key={proj.id} className='border px-8 pr-9 py-4 shadow-sm'>
                  <div className='flex flex-col gap-13 md:flex-row md:items-center md:justify-between md:gap-4'>
                    <div className='min-w-0'>
                      <div className='mb-2 flex flex-wrap items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>出题类项目</span>
                        {proj.is_pinned === true && (
                          <div className='flex items-center gap-1'>
                            <Badge className='border-transparent bg-[#D7FCE3] text-[#00BD65]'>置顶项目</Badge>
                            <Tooltip open={pinnedTooltipOpen} onOpenChange={setPinnedTooltipOpen}>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  className='inline-flex items-center text-muted-foreground'
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setPinnedTooltipOpen((v) => !v)
                                  }}
                                >
                                  <IconInfoCircle className='h-3.5 w-3.5' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side='top'
                                align='center'
                                collisionPadding={12}
                                className='bg-foreground text-background'
                                arrowClassName='bg-foreground fill-foreground'
                              >
                                当置顶项目标签出现时，意味着此项目是一个加急项目，您作为平台信任的专家被项目选中。在一段时间内，其余项目将暂时无法作业，只能在此项目作业。一般置顶项目将会有更高的报酬了！
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                      <div className='text-xl font-semibold leading-7 truncate'>
                        {proj.title || '项目'}
                      </div>
                      {proj.introduction && (
                        <div className='text-muted-foreground mt-1 text-sm line-clamp-1'>
                          {proj.introduction}
                        </div>
                      )}
                      <div className='mt-5'>
                        <Button
                          variant='default'
                          onClick={() =>
                            navigate({
                              to: '/project-detail',
                              search: { project_id: proj.id } as unknown as Record<string, unknown>,
                            })
                          }
                        >
                          开始项目
                        </Button>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-6'>
                      <div className='relative text-center'>
                        <Badge className='bg-white text-gray-500 border shadow-sm absolute -top-6 left-1/2 -translate-x-1/2'>
                          {(() => {
                            const u = proj.unit
                            if (u === 1) return '按任务结算'
                            if (u === 2) return '按条结算'
                            if (u === 0) return '按时结算'
                            return '按任务结算'
                          })()}
                        </Badge>
                        <div className='text-foreground text-lg font-medium'>
                          {typeof proj.price_per_unit === 'number'
                            ? `¥ ${proj.price_per_unit.toFixed(2)}/${(proj.unit ?? 1) === 0 ? '时' : '任务'}`
                            : '—'}
                        </div>
                        <div className='text-muted-foreground text-xs'>正式任务单价</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-foreground text-lg font-medium'>
                          {typeof minutes === 'number' ? `${minutes} min/任务` : '—'}
                        </div>
                        <div className='text-muted-foreground text-xs'>任务预计作业时长</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-foreground text-lg font-medium'>
                          {fmt(proj.start_time) ?? '—'}
                        </div>
                        <div className='text-muted-foreground text-xs'>项目开始时间</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-foreground text-lg font-medium'>
                          {fmt(proj.end_time) ?? '—'}
                        </div>
                        <div className='text-muted-foreground text-xs flex items-center justify-center'>
                          <span className='relative inline-flex items-center'>
                            <span>项目预计结束时间</span>
                            <span className='absolute left-full ml-1'>
                              <Tooltip open={endTimeTooltipOpen} onOpenChange={setEndTimeTooltipOpen}>
                                <TooltipTrigger asChild>
                                  <button
                                    type='button'
                                    className='inline-flex items-center text-muted-foreground/80'
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setEndTimeTooltipOpen((v) => !v)
                                    }}
                                  >
                                    <IconInfoCircle className='h-3.5 w-3.5' />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent 
                                  side='top' 
                                  align='center'
                                  collisionPadding={12}
                                  className='bg-foreground text-background max-w-[calc(100vw-2rem)] whitespace-normal break-words' 
                                  arrowClassName='bg-foreground fill-foreground'
                                >
                                  项目结束时间为一个预估的时间，具体截止时间可能受项目方需求变更、数据收集上限等因素的影响而变化
                                </TooltipContent>
                              </Tooltip>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className='border p-4 shadow-sm'>
              <div className='flex min-h-16 items-center justify-between gap-6'>
                <div className='flex items-center gap-6'>
                  <div className='h-16 shrink-0'>
                    <img
                      src={emptyTopPng}
                      alt='empty top'
                      className='h-24 w-auto object-contain mt-[-14px]'
                    />
                  </div>
                </div>

                <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='text-xs text-black'>
                    您暂时没有可工作项目，快去申请岗位以加入新的项目吧！
                  </div>
                  <Button
                    variant='default'
                    onClick={() => navigate({ to: '/jobs' })}
                    className='rounded-[8px] w-full max-w-[140px] sm:w-auto sm:max-w-none sm:shrink-0'
                  >
                    查看新机会
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* 标签 Tab：我的申请 */}
        <Tabs
          className='flex min-h-0 flex-1 flex-col'
          value={currentTab}
          onValueChange={(value) => {
            const newSearch: Record<string, unknown> = {}
            if (value === 'projects') {
              newSearch.tab = 'projects'
            }
            navigate({ search: newSearch as never })
          }}
        >
          <div className='flex items-center justify-between'>
            <TabsList>
              <TabsTrigger value='applications'>我的申请</TabsTrigger>
              <TabsTrigger value='projects'>项目</TabsTrigger>
            </TabsList>
            <div className='flex items-center gap-3'>
              {currentTab === 'applications' ? (
                <Select
                  value={appsOnlineStatusFilter}
                  onValueChange={(v) => {
                    setAppsOnlineStatusFilter(v as typeof appsOnlineStatusFilter)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className='h-8 w-[140px]'>
                    <SelectValue placeholder='筛选岗位状态' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部</SelectItem>
                    <SelectItem value='10'>招聘中</SelectItem>
                    <SelectItem value='20'>暂时满员</SelectItem>
                    <SelectItem value='0'>停止招聘</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={projectsStatusFilter}
                  onValueChange={(v) => {
                    setProjectsStatusFilter(v as typeof projectsStatusFilter)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className='h-8 w-[140px]'>
                    <SelectValue placeholder='筛选项目状态' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部</SelectItem>
                    <SelectItem value='0'>进行中</SelectItem>
                    <SelectItem value='1'>已结束</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div
                className='text-muted-foreground flex cursor-pointer items-center gap-1'
                onClick={handleHelp}
              >
                <IconHelp className='h-4 w-4' />
                <span className='text-sm'>寻求支持</span>
              </div>
            </div>
          </div>

          <TabsContent value='applications' className='flex min-h-0 flex-1 flex-col'>
            <div className='flex min-h-0 flex-1 flex-col'>
              {isInfiniteMode ? (
                <div
                  ref={appsContainerRef}
                  className='pr-1 overflow-y-auto flex-1 min-h-0'
                >
                  <div className='space-y-3 px-1 py-2 no-scrollbar'>
                  {applications.length === 0 && (
                    <div className='flex min-h-[400px] items-center justify-center'>
                      <div className='text-muted-foreground flex flex-col items-center text-sm'>
                        <img src={noApplySvg} alt='no applications' className='mb-3 h-16 w-16 opacity-70' />
                        <div className='mb-3'>暂无申请记录</div>
                        <Button variant={'outline'} onClick={() => navigate({ to: '/jobs' })}>立即申请</Button>
                      </div>
                    </div>
                  )}
                  {applications.map((item) => {
                    const jd = item.job_detail
                    const status = item.current_node_status ?? '0'
                    type Pill = { text: string; classes: string }
                    const pill: Pill = (() => {
                      if (status === '30') return { text: '已通过', classes: 'bg-[#D7FCE3] text-[#00BD65]' }
                      if (status === '40') return { text: '未录取', classes: 'bg-[#FFDEDD] text-[#F4490B]' }
                      if (status === '20') return { text: '审核中', classes: 'bg-[#4E02E41A] text-[#4E02E4]' }
                      {
                        const progress = item.progress ?? 0
                        const total = item.total_step ?? 0
                        return { text: `未完成（${progress}/${total}）`, classes: 'bg-[#FFF6BC] text-[#B28300]' }
                      }
                    })()
                    const startedText = (() => {
                      const created = item.created_at
                      if (!created || created <= 0) return ''
                      const ms = Date.now() - created * 1000
                      if (ms < 0) return ''
                      const days = Math.floor(ms / (24 * 60 * 60 * 1000))
                      if (days <= 0) return '今天申请'
                      return `${days}天前申请`
                    })()
                    return (
                      <Card
                        key={item.id}
                        className='hover:bg-accent/40 cursor-pointer border transition-colors'
                        onClick={() => {
                          navigate({
                            to: '/interview/prepare',
                            search: {
                              data: `job_id${item.job_id}andisSkipConfirm${true}`,
                              job_apply_id: item.id,
                            } as unknown as Record<string, unknown>,
                          })
                        }}
                      >
                        <div className='flex items-center justify-between gap-4 p-4'>
                          <div className='min-w-0'>
                            <div className='mb-1 flex items-center gap-2'>
                              <div className='font-medium'>
                                {jd?.title ?? '岗位'}
                              </div>
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {jd && jd.salary_max && jd.salary_max > 0 
                                ? `${jd.salary_min ?? 0}-${jd.salary_max}` 
                                : jd?.salary_min ?? 0} / {jd ? salaryTypeUnitMapping[jd.salary_type as keyof typeof salaryTypeUnitMapping] || '小时' : '小时'}
                              <span className='mx-2'>|</span>
                              远程
                              <span className='mx-2'>|</span>
                              {jd?.company?.name
                                ? `${jd.company.name} 发布`
                                : '平台发布'}
                            </div>
                          </div>
                          <div className='flex shrink-0 items-center'>
                            {startedText && (
                              <div className='text-muted-foreground mr-5 text-xs'>
                                {startedText}
                              </div>
                            )}
                            <span
                              className={cn(
                                'inline-flex w-30 items-center justify-center rounded-full px-3 py-1 text-sm',
                                pill.classes,
                              )}
                            >
                              {pill.text}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  </div>
                  <div ref={appsSentinelRef} className='h-6' />
                  <div className='text-center text-xs text-muted-foreground pb-2'>
                    {isFetchingNextPage ? '加载中…' : hasNextPage ? '向下滚动加载更多' : applications.length > 0 ? '没有更多了' : ''}
                  </div>
                </div>
              ) : (
              <ScrollArea className='pr-1 flex-1 min-h-0'>
                <div className='space-y-3 px-1 py-2  no-scrollbar'>
                {loadingAppsPaged && <Skeleton className='h-20 w-full rounded-md' />}
                {!loadingAppsPaged && applications.length === 0 && (
                  <div className='flex min-h-[400px] items-center justify-center'>
                    <div className='text-muted-foreground flex flex-col items-center text-sm'>
                      <img src={noApplySvg} alt='no applications' className='mb-3 h-16 w-16 opacity-70' />
                      <div className='mb-3'>暂无申请记录</div>
                      <Button variant={"outline"} onClick={() => navigate({ to: '/jobs' })}>立即申请</Button>
                    </div>
                  </div>
                )}
                {!loadingAppsPaged &&
                  applications.map((item) => {
                    const jd = item.job_detail
                    
                    // 岗位状态显示 - 优先显示岗位状态，替代申请流程状态
                    const jobStatus = jd?.online_status
                    type Pill = { text: string; classes: string }
                    const pill: Pill = (() => {
                      // 优先显示岗位状态
                      if (jobStatus === 20) {
                        return { 
                          text: '暂时满员', 
                          classes: 'bg-[#FFF3CD] text-[#856404]' // 黄色系，表示暂停状态
                        }
                      }
                      if (jobStatus === 0) {
                        return { 
                          text: '停止招聘', 
                          classes: 'bg-[#F8D7DA] text-[#721C24]' // 红色系，表示停止状态
                        }
                      }
                      
                      // 岗位正常时，显示申请流程状态
                      const status = item.current_node_status ?? '0'
                      // 颜色：绿色 #00BD65；红色 #F4490B
                      // 0/10/50 -> 进行中；20 -> 审核中；30 -> 通过；40 -> 未录取
                      if (status === '30')
                        return { text: '已通过', classes: 'bg-[#D7FCE3] text-[#00BD65]' }
                      if (status === '40')
                        return { text: '未录取', classes: 'bg-[#FFDEDD] text-[#F4490B]' }
                      if (status === '20')
                        return {
                          text: '审核中',
                          classes: 'bg-[#4E02E41A] text-[#4E02E4]',
                        }
                      {
                        const progress = item.progress ?? 0
                        const total = item.total_step ?? 0
                        return {
                          text: `未完成（${progress}/${total}）`,
                          classes: 'bg-[#FFF6BC] text-[#B28300]',
                        }
                      }
                    })()
                    const startedText = (() => {
                      const created = item.created_at
                      if (!created || created <= 0) return ''
                      const ms = Date.now() - created * 1000
                      if (ms < 0) return ''
                      const days = Math.floor(ms / (24 * 60 * 60 * 1000))
                      if (days <= 0) return '今天申请'
                      return `${days}天前申请`
                    })()
                    return (
                      <Card
                        key={item.id}
                        className='hover:bg-accent/40 cursor-pointer border transition-colors'
                        onClick={() => {
                          navigate({
                            to: '/interview/prepare',
                            search: {
                              data: `job_id${item.job_id}andisSkipConfirm${true}`,
                              // 直接传递 job_apply_id，供目标页使用
                              job_apply_id: item.id,
                            } as unknown as Record<string, unknown>,
                          })
                        }}
                      >
                        <div className='flex items-center justify-between gap-4 p-4'>
                          <div className='min-w-0'>
                            <div className='mb-1 flex items-center gap-2'>
                              <div className='font-medium'>
                                {jd?.title ?? '岗位'}
                              </div>
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {jd && jd.salary_max && jd.salary_max > 0 
                                ? `${jd.salary_min ?? 0}-${jd.salary_max}` 
                                : jd?.salary_min ?? 0} / {jd ? salaryTypeUnitMapping[jd.salary_type as keyof typeof salaryTypeUnitMapping] || '小时' : '小时'}
                              <span className='mx-2'>|</span>
                              远程
                              <span className='mx-2'>|</span>
                              {jd?.company?.name
                                ? `${jd.company.name} 发布`
                                : '平台发布'}
                            </div>
                          </div>

                          <div className='flex shrink-0 items-center'>
                            {startedText && (
                              <div className='text-muted-foreground mr-5 text-xs'>
                                {startedText}
                              </div>
                            )}
                            <span
                              className={cn(
                                'inline-flex w-30 items-center justify-center rounded-full px-3 py-1 text-sm',
                                pill.classes,
                              )}
                            >
                              {pill.text}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
              )}
            </div>
            {!isInfiniteMode && (
              <div className='flex items-center justify-end gap-2 pt-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  上一页
                </Button>
                <div className='text-muted-foreground text-xs'>
                  第 {page + 1} / {pageCount} 页
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='projects' className='flex min-h-0 flex-1 flex-col'>
            <div className='flex min-h-0 flex-1 flex-col'>
              {isInfiniteMode ? (
                <div
                  ref={projectsContainerRef}
                  className='pr-1 overflow-y-auto flex-1 min-h-0'
                >
                  <div className='space-y-3 px-1 py-2 no-scrollbar'>
                  {projects.length === 0 && (
                    <div className='flex min-h-[400px] items-center justify-center'>
                      <div className='text-muted-foreground flex flex-col items-center text-sm'>
                        <img src={noApplySvg} alt='no projects' className='mb-3 h-16 w-16 opacity-70' />
                        <div className='mb-3'>暂无项目记录</div>
                      </div>
                    </div>
                  )}
                  {projects.map((project) => {
                    const canSelectPinned =
                      project.is_pinned === true ||
                      (topProjectId !== undefined && project.id === topProjectId)
                    const disabled = hasTopProject && !canSelectPinned
                    const startedText = (() => {
                      const created = project.created_at
                      if (!created || created <= 0) return ''
                      const ms = Date.now() - created * 1000
                      if (ms < 0) return ''
                      const days = Math.floor(ms / (24 * 60 * 60 * 1000))
                      if (days <= 0) return '今天创建'
                      return `${days}天前创建`
                    })()
                    return (
                      <Card
                        key={project.id}
                        className={cn('border transition-colors', disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-accent/40 cursor-pointer')}
                        onClick={disabled ? undefined : () => {
                          navigate({
                            to: '/project-detail',
                            search: {
                              project_id: project.id,
                            } as unknown as Record<string, unknown>,
                          })
                        }}
                      >
                        <div className='flex items-center justify-between gap-4 p-4'>
                          <div className='min-w-0'>
                            <div className='mb-1 flex items-center gap-2'>
                              <div className='font-medium'>
                                {project.title || '项目'}
                              </div>
                              {project.status === 1 && (
                                <Badge className='border bg-muted text-muted-foreground shadow-sm'>
                                  已结束
                                </Badge>
                              )}
                            </div>
                            {project.desc && (
                              <div className='text-muted-foreground text-xs line-clamp-1'>
                                {project.desc}
                              </div>
                            )}
                          </div>
                          <div className='flex shrink-0 items-center'>
                            {startedText && (
                              <div className='text-muted-foreground text-xs'>
                                {startedText}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  </div>
                  <div ref={projectsSentinelRef} className='h-6' />
                  <div className='text-center text-xs text-muted-foreground pb-2'>
                    {isFetchingNextProjectPage ? '加载中…' : hasNextProjectPage ? '向下滚动加载更多' : projects.length > 0 ? '没有更多了' : ''}
                  </div>
                </div>
              ) : (
              <ScrollArea className='pr-1 flex-1 min-h-0'>
                <div className='space-y-3 px-1 py-2 no-scrollbar'>
                {loadingProjectsPaged && <Skeleton className='h-20 w-full rounded-md' />}
                {!loadingProjectsPaged && projects.length === 0 && (
                  <div className='flex min-h-[400px] items-center justify-center'>
                    <div className='text-muted-foreground flex flex-col items-center text-sm'>
                      <img src={noApplySvg} alt='no projects' className='mb-3 h-16 w-16 opacity-70' />
                      <div className='mb-3'>暂无项目记录</div>
                    </div>
                  </div>
                )}
                {!loadingProjectsPaged &&
                  projects.map((project) => {
                    const canSelectPinned =
                      project.is_pinned === true ||
                      (topProjectId !== undefined && project.id === topProjectId)
                    const disabled = hasTopProject && !canSelectPinned
                    const startedText = (() => {
                      const created = project.created_at
                      if (!created || created <= 0) return ''
                      const ms = Date.now() - created * 1000
                      if (ms < 0) return ''
                      const days = Math.floor(ms / (24 * 60 * 60 * 1000))
                      if (days <= 0) return '今天创建'
                      return `${days}天前创建`
                    })()
                    return (
                      <Card
                        key={project.id}
                        className={cn('border transition-colors', disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-accent/40 cursor-pointer')}
                        onClick={disabled ? undefined : () => {
                          navigate({
                            to: '/project-detail',
                            search: {
                              project_id: project.id,
                            } as unknown as Record<string, unknown>,
                          })
                        }}
                      >
                        <div className='flex items-center justify-between gap-4 p-4'>
                          <div className='min-w-0'>
                            <div className='mb-1 flex items-center gap-2'>
                              <div className='font-medium'>
                                {project.title || '项目'}
                              </div>
                              {project.status === 1 && (
                                <Badge className='border bg-muted text-muted-foreground shadow-sm'>
                                  已结束
                                </Badge>
                              )}
                            </div>
                            {project.desc && (
                              <div className='text-muted-foreground text-xs line-clamp-1'>
                                {project.desc}
                              </div>
                            )}
                          </div>
                          <div className='flex shrink-0 items-center'>
                            {startedText && (
                              <div className='text-muted-foreground text-xs'>
                                {startedText}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
              )}
            </div>
            {!isInfiniteMode && (
              <div className='flex items-center justify-end gap-2 pt-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  上一页
                </Button>
                <div className='text-muted-foreground text-xs'>
                  第 {page + 1} / {projectsPageCount} 页
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page + 1 >= projectsPageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 寻求支持弹窗 */}
        <SupportDialog
          open={helpOpen}
          onOpenChange={setHelpOpen}
        />
      </Main>
    </>
  )

}
