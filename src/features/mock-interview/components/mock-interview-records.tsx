import { useMemo, useState, useRef, useEffect } from 'react'
import { navigate } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import MockEmptyState from '@/features/mock-interview/components/empty-state'
import { useQuery } from '@tanstack/react-query'
import { fetchMockInterviewRecords, useInfiniteMockInterviewRecords } from '@/features/mock-interview/api'
import type { MockInterviewRecordApiItem } from '@/features/mock-interview/types'
import { IconDots } from '@tabler/icons-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJobApplyWorkflow, getInterviewNodeId } from '@/features/interview/api'
import { toast } from 'sonner'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'

function RecordCard({ item, onReport, onMore, onReinterview }: { item: MockInterviewRecordApiItem; onReport: () => void; onMore: () => void; onReinterview: () => void }) {
  const statusNum = typeof item.status === 'number' ? item.status : parseInt(String(item.status ?? '0'), 10)
  const reportReady = statusNum === 20
  const [isRetaking, setIsRetaking] = useState(false)

  // 获取workflow信息以获取interview_node_id
  const { data: workflow } = useJobApplyWorkflow(item.job_apply_id ?? null, Boolean(item.job_apply_id))
  const interviewNodeId = getInterviewNodeId(workflow)

  const handleReinterview = async () => {
    if (!interviewNodeId) {
      toast.error('无法获取面试节点信息，请稍后重试')
      return
    }

    setIsRetaking(true)
    try {
      // const result = await postNodeAction({
      //   node_id: interviewNodeId,
      //   trigger: NodeActionTrigger.Retake,
      //   result_data: {}
      // })

      // if (result.success) {
      // 清除相关的查询缓存，确保prepare页面能获取到最新数据
      // queryClient.invalidateQueries({ queryKey: ['job-apply-workflow', item.job_apply_id] })
      // queryClient.removeQueries({ queryKey: ['job-apply-workflow', item.job_apply_id] })
      onReinterview()
      // } else {
      //   toast.error('重新面试申请失败，请稍后重试')
      // }
    } catch (_error) {
      // 记录错误但不在生产环境输出到控制台
      toast.error('重新面试申请失败，请稍后重试')
    } finally {
      setIsRetaking(false)
    }
  }
  return (
    <div className='h-[82px] flex items-center justify-between rounded-xl border transition-shadow border-[#4E02E40D] shadow-[0_0_4px_0_#00000010] hover:bg-[#F4EAFD] hover:border-[#4E02E4] hover:shadow-[0_0_12px_0_#4E02E423] px-4'>
      <div className='shrink-0 w-12 h-12 rounded-[8px] bg-[rgba(78,2,228,0.2)] md:flex items-center justify-center mr-4 hidden'>
        <span
          className='h-6 w-6 bg-white drop-shadow-sm'
          style={{
            WebkitMaskImage: `url(${item.category_image})`,
            maskImage: `url(${item.category_image})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      </div>
      <div className='min-w-0 pr-4 w-full'>
        <div className='flex items-center gap-4 min-w-0'>
          <div className='font-medium truncate text-base'>{item.job_title}</div>
          <span className='inline-flex items-center justify-center px-2 py-1 md:px-3 md:py-1.5 text-xs font-medium text-[#4E02E4] bg-[#4E02E40D] rounded-full whitespace-nowrap'>
            {item.interview_duration_minutes}分钟
          </span>
        </div>
        <div className='text-xs text-muted-foreground mt-2 truncate'>
          {new Date(item.applied_at).toLocaleString()}
        </div>
      </div>
      {/* 桌面端布局 */}
      <div className='hidden md:flex items-center gap-2 shrink-0'>
        {!reportReady && <span className='text-[12px] text-gray-400'>生成时间约30秒</span>}
        <Button
          size='sm'
          onClick={() => { if (!reportReady) return; onReport() }}
          className={
            reportReady
              ? 'text-xs text-white bg-[linear-gradient(89.99deg,_#4E02E4_9.53%,_#C994F7_99.99%)] hover:opacity-90 h-[28px]'
              : 'text-xs text-[#4E02E4] bg-[#4E02E41A] h-[28px] hover:bg-[#4E02E41A] hover:text-[#4E02E4] hover:opacity-100 focus-visible:ring-0 focus-visible:outline-none active:opacity-100 cursor-default'
          }
        >
          {reportReady ? '查看面试报告' : '面试报告生成中'}
        </Button>
        <div className='relative group'>
          <button type='button' onClick={onMore} className='px-2 py-1 text-sm text-[#4E02E4] hover:underline' aria-label='更多操作' title='更多操作'>
            <IconDots className='h-4 w-4' />
          </button>
          <div className='absolute right-0 top-full z-10 hidden group-hover:block'>
            <div className='mt-1 rounded-md border bg-background p-1 shadow-md'>
              <Button
                onClick={handleReinterview}
                disabled={isRetaking || !interviewNodeId}
                variant='ghost'
                size='sm'
                className='w-full justify-start !text-[#4E02E4] text-xs hover:underline underline-offset-4 hover:!text-[#4E02E4] focus-visible:!text-[#4E02E4] active:!text-[#4E02E4] disabled:opacity-50'
              >
                {isRetaking ? '处理中...' : '重新面试'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端布局 - 上下排列 */}
      <div className='md:hidden flex flex-col items-end gap-1 shrink-0'>
        <Button
          size='sm'
          onClick={() => { if (!reportReady) return; onReport() }}
          className={
            reportReady
              ? 'text-xs text-white bg-[linear-gradient(89.99deg,_#4E02E4_9.53%,_#C994F7_99.99%)] hover:opacity-90 h-[28px]'
              : 'text-xs text-[#4E02E4] bg-[#4E02E41A] h-[28px] hover:bg-[#4E02E41A] hover:text-[#4E02E4] hover:opacity-100 focus-visible:ring-0 focus-visible:outline-none active:opacity-100 cursor-default'
          }
        >
          {reportReady ? '查看面试报告' : '面试报告生成中'}
        </Button>
        {!reportReady && <span className='text-[12px] text-gray-400'>生成时间约30秒</span>}
      </div>
    </div>
  )
}

export default function MockInterviewRecords() {
  const env = useRuntimeEnv()
  const isInfiniteMode = env === 'mobile' || env === 'wechat-miniprogram'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { data } = useQuery({
    queryKey: ['mock-interview-records', { page, pageSize }],
    queryFn: () => fetchMockInterviewRecords({ skip: (page - 1) * pageSize, limit: pageSize, q: undefined }),
    enabled: !isInfiniteMode,
  })
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMockInterviewRecords({ limit: pageSize }, { enabled: isInfiniteMode })

  const apiItems = useMemo<MockInterviewRecordApiItem[]>(() => {
    if (isInfiniteMode) {
      const pages = infiniteData?.pages ?? []
      return pages.flatMap((p) => (p.items ?? [])) as MockInterviewRecordApiItem[]
    }
    return (data?.items ?? []) as MockInterviewRecordApiItem[]
  }, [isInfiniteMode, infiniteData, data])
  const total = isInfiniteMode ? (infiniteData?.pages?.[0]?.count ?? 0) : (data?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      <div className='flex min-h-0 flex-1'>
        {apiItems.length === 0 ? (
          <MockEmptyState />
        ) : isInfiniteMode ? (
          <InfiniteList
            items={apiItems}
            fetchNextPage={fetchNextPage}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={!!isFetchingNextPage}
          />
        ) : (
          <div className='flex-1 overflow-y-auto px-[4px] mx-[-4px] py-2'>
            <div className='space-y-3'>
              {apiItems.map((it, idx) => (
                <RecordCard
                  key={(it.job_id ?? 0) || idx}
                  item={it}
                  onReport={() => navigate('/interview-reports', { job_id: (it.job_id ?? 0) || idx + 1 })}
                  onMore={() => {}}
                  onReinterview={() => navigate('/interview/prepare', { data: `job_id${(it.job_id ?? 0) || idx + 1}andisMock${true}andcountdown${it.interview_duration_minutes}` })}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 移动端优化的分页组件（仅桌面/非无限模式显示） */}
      {!isInfiniteMode && (
      <div className='mt-4 shrink-0'>
        {/* 桌面端布局 */}
        <div className='hidden md:flex items-center justify-end gap-3'>
          <div className='text-sm text-muted-foreground'>共 {total} 条</div>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>每页</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(Number(v)) }}>
              <SelectTrigger size='sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side='top' avoidCollisions>
                {[10, 20, 30].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className='text-sm text-muted-foreground'>条</span>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
            <span className='text-sm text-muted-foreground'>第 {page} / {totalPages} 页</span>
            <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>下一页</Button>
          </div>
          <Button variant='ghost' size='sm' onClick={() => { setPage(1); setPageSize(10) }}>重置</Button>
        </div>

        {/* 移动端布局 - 简化版本 */}
        <div className='md:hidden'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>共 {total} 条</div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className='px-3'
              >
                上一页
              </Button>
              <span className='text-sm text-muted-foreground'>第 {page} / {totalPages} 页</span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className='px-3'
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

function InfiniteList({
  items,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: {
  items: MockInterviewRecordApiItem[]
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const rootEl = containerRef.current
    const sentinel = sentinelRef.current
    if (!rootEl || !sentinel) return
    const io = new IntersectionObserver(
      (es) => {
        const e = es[0]
        if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: rootEl, rootMargin: '0px 0px 200px 0px', threshold: 0.1 }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div ref={containerRef} className='flex-1 overflow-y-auto px-[4px] mx-[-4px] py-2'>
      <div className='space-y-3'>
        {items.map((it, idx) => (
          <RecordCard
            key={(it.job_id ?? 0) || idx}
            item={it}
            onReport={() => navigate('/interview-reports', { job_id: (it.job_id ?? 0) || idx + 1 })}
            onMore={() => {}}
            onReinterview={() => navigate('/interview/prepare', { data: `job_id${(it.job_id ?? 0) || idx + 1}andisMock${true}andcountdown${it.interview_duration_minutes}` })}
          />
        ))}
        <div ref={sentinelRef} className='h-6' />
        <div className='text-center text-xs text-muted-foreground pb-2 mb-24'>
          {isFetchingNextPage ? '加载中…' : hasNextPage ? '向下滚动加载更多' : items.length > 0 ? '没有更多了' : ''}
        </div>
      </div>
    </div>
  )
}
