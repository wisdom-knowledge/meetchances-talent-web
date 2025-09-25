import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import MockEmptyState from '@/features/mock-interview/components/empty-state'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMockInterviewRecords } from '@/features/mock-interview/api'
import type { MockInterviewRecordApiItem } from '@/features/mock-interview/types'
import { IconArrowLeft, IconDots } from '@tabler/icons-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJobApplyWorkflow, getInterviewNodeId, postNodeAction, NodeActionTrigger } from '@/features/interview/api'
import { toast } from 'sonner'

function RecordCard({ item, onReport, onMore, onReinterview }: { item: MockInterviewRecordApiItem; onReport: () => void; onMore: () => void; onReinterview: () => void }) {
  const statusNum = typeof item.status === 'number' ? item.status : parseInt(String(item.status ?? '0'), 10)
  const reportReady = statusNum === 20
  const [isRetaking, setIsRetaking] = useState(false)
  const queryClient = useQueryClient()
  
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
      const result = await postNodeAction({
        node_id: interviewNodeId,
        trigger: NodeActionTrigger.Retake,
        result_data: {}
      })
      
      if (result.success) {
        // 清除相关的查询缓存，确保prepare页面能获取到最新数据
        queryClient.invalidateQueries({ queryKey: ['job-apply-workflow', item.job_apply_id] })
        queryClient.removeQueries({ queryKey: ['job-apply-workflow', item.job_apply_id] })
        onReinterview()
      } else {
        toast.error('重新面试申请失败，请稍后重试')
      }
    } catch (_error) {
      // 记录错误但不在生产环境输出到控制台
      toast.error('重新面试申请失败，请稍后重试')
    } finally {
      setIsRetaking(false)
    }
  }
  return (
    <div className='h-[82px] flex items-center justify-between rounded-xl border transition-shadow border-[#4E02E40D] shadow-[0_0_4px_0_#00000040] hover:bg-[#F4EAFD] hover:border-[#4E02E4] hover:shadow-[0_0_12px_0_#4E02E433] px-4'>
      <div className='min-w-0 pr-4 w-full'>
        <div className='flex items-center gap-4 min-w-0'>
          <div className='font-medium truncate text-base'>{item.job_title}</div>
          <span className='text-xs whitespace-nowrap text-[#4E02E4]'>{item.interview_duration_minutes}分钟</span>
        </div>
        <div className='text-xs text-muted-foreground mt-2 truncate'>
          {new Date(item.applied_at).toLocaleString()}
        </div>
      </div>
      <div className='flex items-center gap-2 shrink-0'>
        <Button
          size='sm'
          onClick={() => { if (!reportReady) return; onReport() }}
          className={
            reportReady
              ? 'text-xs text-white bg-[linear-gradient(89.99deg,_#4E02E4_9.53%,_#C994F7_99.99%)] hover:opacity-90 w-[130px] h-[28px]'
              : 'text-xs text-[#4E02E4] bg-[#4E02E41A] w-[130px] h-[28px] hover:bg-[#4E02E41A] hover:text-[#4E02E4] hover:opacity-100 focus-visible:ring-0 focus-visible:outline-none active:opacity-100 cursor-default'
          }
        >
          {reportReady ? '查看面试报告' : '面试报告生成中'}
        </Button>
        <div className='relative group'>
          <button type='button' onClick={onMore} className='px-2 py-1 text-sm text-[#4E02E4] hover:underline'>
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
    </div>
  )
}

export default function MockInterviewRecordsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { data } = useQuery({
    queryKey: ['mock-interview-records', { page, pageSize }],
    queryFn: () => fetchMockInterviewRecords({ skip: (page - 1) * pageSize, limit: pageSize, q: undefined }),
  })
  const apiItems = useMemo<MockInterviewRecordApiItem[]>(() => (data?.items ?? []) as MockInterviewRecordApiItem[], [data])
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'></div>
      </Header>
      <Main fixed>
        {/* 顶部返回按钮（独立一行） */}
        <div>
          <Button variant='ghost' size='sm' onClick={() => navigate({ to: '/mock-interview', search: { page: 1, pageSize: 9, q: '', category: undefined } })}>
            <IconArrowLeft className='h-4 w-4' /> 返回
          </Button>
        </div>
        {/* 标题 */}
        <h1 className='mt-3 text-2xl font-bold tracking-tight md:text-3xl mb-6'>模拟面试记录</h1>

        <div className='flex min-h-0 flex-1'>
          {apiItems.length === 0 ? (
            <MockEmptyState />
          ) : (
            <div className='flex-1 overflow-y-auto px-[4px] mx-[-4px] py-2'>
              <div className='space-y-3'>
                {apiItems.map((it, idx) => (
                  <RecordCard
                    key={(it.job_id ?? 0) || idx}
                    item={it}
                    onReport={() => navigate({ to: '/interview-reports', search: { job_id: (it.job_id ?? 0) || idx + 1 } })}
                    onMore={() => {}}
                    onReinterview={() => navigate({ to: '/interview/prepare', search: { data: `job_id${(it.job_id ?? 0) || idx + 1}andisMock${true}andcountdown${it.interview_duration_minutes}` } as unknown as Record<string, unknown> })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='mt-4 flex items-center justify-end gap-3'>
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
      </Main>
    </>
  )
}


