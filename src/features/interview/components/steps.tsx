import { cn } from '@/lib/utils'
import { useJobApplyProgress, JobApplyNodeStatus } from '@/features/interview/api'

interface StepsProps {
  jobApplyId: string | number | null
  className?: string
}

type VisualStepStatus = 'completed' | 'inProgress' | 'notStarted'

function mapNodeStatusToVisual(status: JobApplyNodeStatus): VisualStepStatus {
  switch (status) {
    // 已完成：30
    case JobApplyNodeStatus.Approved:
      return 'completed'
    // 进行中：10、20
    case JobApplyNodeStatus.InProgress:
    case JobApplyNodeStatus.CompletedPendingReview:
      return 'inProgress'
    // 未开始：0
    case JobApplyNodeStatus.NotStarted:
      return 'notStarted'
    // 其他状态（如 40、50）暂按已完成处理，避免样式缺省
    default:
      return 'completed'
  }
}

export function Steps({ jobApplyId, className }: StepsProps) {
  const { data, isLoading } = useJobApplyProgress(jobApplyId, Boolean(jobApplyId))

  if (!jobApplyId) return null

  return (
    <div className={cn('mt-8', className)}>
      <div className='flex items-center gap-6'>
        {(isLoading ? Array.from({ length: 2 }).map(() => ({ node_name: '加载中…', node_status: JobApplyNodeStatus.NotStarted })) : (data ?? [])).map((node, idx) => {
          const visual = mapNodeStatusToVisual(node.node_status as JobApplyNodeStatus)
          const barClass =
            visual === 'completed'
              ? 'bg-[linear-gradient(90deg,var(--steps-completed-from)_0%,var(--steps-completed-to)_100%)]'
              : visual === 'inProgress'
              ? 'bg-[var(--steps-inprogress-bg)]'
              : 'bg-muted'
          const labelClass =
            visual === 'notStarted' ? 'text-muted-foreground' : 'text-foreground'
          return (
            <div key={`${idx}-${node.node_name}`} className='flex-1'>
              <div className={cn('h-2 w-full rounded-full', barClass)} />
              <div className={cn('text-sm font-medium mb-2 text-center py-2', labelClass)}>{node.node_name}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


