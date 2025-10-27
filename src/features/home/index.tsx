import { useState, useMemo, useRef, useEffect } from 'react'
import { navigate as appNavigate } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { IconX, IconHelp } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import noApplySvg from '@/assets/images/no-apply.svg'
import noOfferSvg from '@/assets/images/no-offer.svg'
import { salaryTypeUnitMapping } from '@/features/jobs/constants'
import {
  useImportantTasksQuery,
  useMyApplicationsQuery,
  useInfiniteMyApplicationsQuery,
  type ApiApplyListItem,
} from './api'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'

export default function HomeViewPage() {
  const env = useRuntimeEnv()
  const authUser = useAuthStore((s) => s.auth.user)
  const displayName = authUser?.full_name || authUser?.username || ''
  const { data: taskList = [], isLoading: loadingTasks } =
    useImportantTasksQuery()
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const visibleTasks = taskList.filter((t) => !dismissed[t.id])

  const [page, setPage] = useState(0)
  const pageSize = 10
  const isInfiniteMode = env === 'mobile' || env === 'wechat-miniprogram'
  const appsContainerRef = useRef<HTMLDivElement | null>(null)
  const appsSentinelRef = useRef<HTMLDivElement | null>(null)

  const { data: appsData, isLoading: loadingAppsPaged } = useMyApplicationsQuery(
    { skip: page * pageSize, limit: pageSize },
    { enabled: !isInfiniteMode }
  )
  const {
    data: infiniteApps,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMyApplicationsQuery(
    { limit: pageSize },
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

  // 移动端/小程序：监听“我的申请”列表底部以加载下一页
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

  // Offer 列表：暂未接入数据，先提供空状态逻辑与样式对齐
  const loadingOffers = false
  const offers: unknown[] = []

  const [helpOpen, setHelpOpen] = useState(false)
  const handleHelp = () => setHelpOpen(true)

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='md:mx-16 py-0'>
        <div className='md:flex md:items-end'>
          <h1 className='text-xl font-bold tracking-tight md:text-2xl mr-3'>
            欢迎回来{displayName ? `，${displayName}` : ''}
          </h1>
          <p className='text-muted-foreground'>查看你的任务与申请进度</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 重要任务 */}
        {(loadingTasks || visibleTasks.length > 0) && (
          <div className='mb-6'>
            <div className='text-foreground mb-3 text-[15px] font-medium'>
              重要任务（{loadingTasks ? '…' : visibleTasks.length}）
            </div>
            {loadingTasks ? (
              <Skeleton className='h-[104px] w-[300px] rounded-md' />
            ) : (
              <div className='space-y-3'>
                {visibleTasks.map((task) => (
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* 标签 Tab：我的申请 */}
        <Tabs defaultValue='applications'>
          <div className='flex items-center justify-between'>
            <TabsList>
              <TabsTrigger value='applications'>我的申请</TabsTrigger>
              <TabsTrigger value='offer'>Offer</TabsTrigger>
            </TabsList>
            <div
              className='text-muted-foreground flex cursor-pointer items-center gap-1'
              onClick={handleHelp}
            >
              <IconHelp className='h-4 w-4' />
              <span className='text-sm'>寻求支持</span>
            </div>
          </div>

          <TabsContent value='applications'>
            {isInfiniteMode ? (
              <div
                ref={appsContainerRef}
                className={cn(
                  'pr-1 overflow-y-auto',
                  loadingTasks || visibleTasks.length > 0
                    ? 'h-[calc(100vh-25rem)]'
                    : 'h-[calc(100vh-14rem)]'
                )}
              >
                <div className='space-y-3 px-1 py-2 no-scrollbar'>
                  {applications.length === 0 && (
                    <div className='flex min-h-[400px] items-center justify-center'>
                      <div className='text-muted-foreground flex flex-col items-center text-sm'>
                        <img src={noApplySvg} alt='no applications' className='mb-3 h-16 w-16 opacity-70' />
                        <div className='mb-3'>暂无申请记录</div>
                        <Button variant={'outline'} onClick={() => appNavigate('/jobs')}>立即申请</Button>
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
                          appNavigate('/interview/prepare', {
                            data: `job_id${item.job_id}andisSkipConfirm${true}`,
                            job_apply_id: item.id,
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
            <ScrollArea
              className={cn(
                'pr-1',
                loadingTasks || visibleTasks.length > 0
                  ? 'h-[calc(100vh-28rem)]'
                  : 'h-[calc(100vh-17rem)]'
              )}
            >
              <div className='space-y-3 px-1 py-2  no-scrollbar'>
                {loadingAppsPaged && <Skeleton className='h-20 w-full rounded-md' />}
                {!loadingAppsPaged && applications.length === 0 && (
                  <div className='flex min-h-[400px] items-center justify-center'>
                    <div className='text-muted-foreground flex flex-col items-center text-sm'>
                      <img src={noApplySvg} alt='no applications' className='mb-3 h-16 w-16 opacity-70' />
                      <div className='mb-3'>暂无申请记录</div>
                      <Button variant={"outline"} onClick={() => appNavigate('/jobs')}>立即申请</Button>
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
                          appNavigate('/interview/prepare', {
                            data: `job_id${item.job_id}andisSkipConfirm${true}`,
                            // 直接传递 job_apply_id，供目标页使用
                            job_apply_id: item.id,
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

          <TabsContent value='offer'>
            <ScrollArea
              className={cn(
                'pr-1',
                loadingTasks || visibleTasks.length > 0
                  ? 'h-[calc(100vh-25rem)]'
                  : 'h-[calc(100vh-14rem)]'
              )}
            >
              <div className='space-y-3'>
                {loadingOffers && <Skeleton className='h-20 w-full rounded-md' />}
                {!loadingOffers && offers.length === 0 && (
                  <div className='flex min-h-[400px] items-center justify-center'>
                    <div className='text-muted-foreground flex flex-col items-center text-sm'>
                      <img src={noOfferSvg} alt='no offers' className='mb-3 h-16 w-16 opacity-70' />
                      <div>暂无录用记录</div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
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
