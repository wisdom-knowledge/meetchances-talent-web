import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
import SupportDialog from '@/components/support-dialog'
import noApplySvg from '@/assets/images/no-apply.svg'
import noOfferSvg from '@/assets/images/no-offer.svg'
import {
  fetchForHelp,
  useImportantTasksQuery,
  useMyApplicationsQuery,
  type ApiApplyListItem,
} from './api'
import { toast } from 'sonner'

export default function HomeViewPage() {
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.auth.user)
  const displayName = authUser?.full_name || authUser?.username || ''
  const { data: taskList = [], isLoading: loadingTasks } =
    useImportantTasksQuery()
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const visibleTasks = taskList.filter((t) => !dismissed[t.id])

  const [page, setPage] = useState(0)
  const pageSize = 10
  const { data: appsData, isLoading: loadingApps } = useMyApplicationsQuery({
    skip: page * pageSize,
    limit: pageSize,
  })
  const total = appsData?.total ?? 0
  const applications: ApiApplyListItem[] = (appsData?.data ??
    []) as ApiApplyListItem[]
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 0
  const canNext = page + 1 < pageCount

  // Offer 列表：暂未接入数据，先提供空状态逻辑与样式对齐
  const loadingOffers = false
  const offers: unknown[] = []

  const [helpOpen, setHelpOpen] = useState(false)
  const handleHelp = () => setHelpOpen(true)
  const handleSupportSubmit = async (_payload: {
    message: string
    contactMethod: 'phone' | 'none'
    phone?: string
  }) => {
    try {
      await fetchForHelp({
        detail: _payload.message,
        need_contact: _payload.contactMethod === 'phone',
        phone_number: _payload.phone ?? '',
      })
      toast.success('提交成功')
    } catch {
      // 统一错误处理由全局 QueryClient/handle-server-error 负责
    }
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            欢迎回来{displayName ? `，${displayName}` : ''}
          </h1>
          <p className='text-muted-foreground'>查看你的任务与申请进度</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 重要任务 */}
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
            <ScrollArea className='h-[calc(100vh-30rem)] pr-1'>
              <div className='space-y-3 px-1 py-2  no-scrollbar'>
                {loadingApps && <Skeleton className='h-20 w-full rounded-md' />}
                {!loadingApps && applications.length === 0 && (
                  <div className='flex min-h-[400px] items-center justify-center'>
                    <div className='text-muted-foreground flex flex-col items-center text-sm'>
                      <img src={noApplySvg} alt='no applications' className='mb-3 h-16 w-16 opacity-70' />
                      <div className='mb-3'>暂无申请记录</div>
                      <Button variant={"outline"} onClick={() => navigate({ to: '/jobs' })}>立即申请</Button>
                    </div>
                  </div>
                )}
                {!loadingApps &&
                  applications.map((item) => {
                    const jd = item.job_detail
                    // 根据最新需求：根据 current_node_status 展示状态 Pill
                    const status = item.current_node_status ?? '0'
                    type Pill = { text: string; classes: string }
                    const pill: Pill = (() => {
                      // 颜色：绿色 #00BD65；红色 #F4490B
                      // 0/10/50 -> 进行中；20 -> 审核中；30 -> 通过；40 -> 已拒绝
                      if (status === '30')
                        return { text: '已通过', classes: 'bg-[#D7FCE3] text-[#00BD65]' }
                      if (status === '40')
                        return { text: '已拒绝', classes: 'bg-[#FFDEDD] text-[#F4490B]' }
                      if (status === '20')
                        return {
                          text: '审核中',
                          classes: 'bg-[#4E02E41A] text-[#4E02E4]',
                        }
                      return {
                        text: '未完成',
                        classes: 'bg-amber-200 text-amber-900',
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
                              {jd?.salary_min ?? 0}-{jd?.salary_max ?? 0} / 小时
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
          </TabsContent>

          <TabsContent value='offer'>
            <ScrollArea className='h-[calc(100vh-30rem)] pr-1'>
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
          onSubmit={handleSupportSubmit}
        />
      </Main>
    </>
  )
}
