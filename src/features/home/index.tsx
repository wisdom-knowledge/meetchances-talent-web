import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { IconX, IconHelp } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import SupportDialog from '@/components/support-dialog'
import {
  fetchForHelp,
  useImportantTasksQuery,
  useMyApplicationsQuery,
  type ApiApplyListItem,
} from './api'

export default function HomeViewPage() {
  const navigate = useNavigate()
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

  const [helpOpen, setHelpOpen] = useState(false)
  const handleHelp = () => setHelpOpen(true)
  const handleSupportSubmit = async (_payload: {
    message: string
    contactMethod: 'phone' | 'none'
    phone?: string
  }) => {
    fetchForHelp({
      detail: _payload.message,
      need_contact: _payload.contactMethod === 'phone',
      phone_number: _payload.phone ?? '',
    })
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
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            欢迎回来，
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
              <div className='space-y-3'>
                {loadingApps && <Skeleton className='h-20 w-full rounded-md' />}
                {!loadingApps && applications.length === 0 && (
                  <div className='text-muted-foreground text-sm'>
                    暂无申请记录
                  </div>
                )}
                {!loadingApps &&
                  applications.map((item) => {
                    const jd = item.job_detail
                    const isCompleted =
                      (item.total_step ?? 0) > 0 &&
                      (item.progress ?? 0) >= (item.total_step ?? 0)
                    const tagLabel =
                      jd?.online_status === 0 ? '招聘中' : '结束招聘'
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
                          if (!isCompleted) {
                            navigate({
                              to: '/interview/prepare',
                              search: {
                                data: `job_id${item.job_id}andisSkipConfirm${true}`,
                              } as unknown as Record<string, unknown>,
                            })
                          }
                        }}
                      >
                        <div className='flex items-center justify-between gap-4 p-4'>
                          <div className='min-w-0'>
                            <div className='mb-1 flex items-center gap-2'>
                              <div className='font-medium'>
                                {jd?.title ?? '岗位'}
                              </div>
                              <Badge
                                variant={
                                  tagLabel === '招聘中' ? 'emphasis' : 'outline'
                                }
                              >
                                {tagLabel}
                              </Badge>
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
                            {isCompleted ? (
                              <span className='inline-flex w-30 items-center justify-center rounded-full bg-emerald-500 px-3 py-1 text-sm text-white'>
                                已完成
                              </span>
                            ) : (
                              <span className='inline-flex w-30 items-center justify-center rounded-full bg-amber-200 px-3 py-1 text-sm text-amber-900'>
                                未完成 ({item.progress ?? 0}/
                                {item.total_step ?? 0})
                              </span>
                            )}
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
