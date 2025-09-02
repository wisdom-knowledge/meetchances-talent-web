import { cn } from '@/lib/utils'
import { useJobApplyProgress, JobApplyNodeStatus } from '@/features/interview/api'

interface StepsProps {
  jobId: string | number | null
  className?: string
}

type VisualStepStatus = 'completed' | 'inProgress' | 'notStarted'

function mapNodeStatusToVisual(status: JobApplyNodeStatus): VisualStepStatus {
  if (
    status === JobApplyNodeStatus.CompletedPendingReview ||
    status === JobApplyNodeStatus.Approved ||
    status === JobApplyNodeStatus.Rejected
  ) {
    return 'completed'
  }
  if (status === JobApplyNodeStatus.InProgress) return 'inProgress'
  return 'notStarted'
}

export function Steps({ jobId, className }: StepsProps) {
  const { data, isLoading } = useJobApplyProgress(jobId, Boolean(jobId))

  if (!jobId) return null

  return (
    <div className={cn('mt-8', className)}>
      <div className='flex items-center gap-6'>
        {(isLoading ? Array.from({ length: 2 }).map(() => ({ node_name: '加载中…', node_status: JobApplyNodeStatus.NotStarted })) : (data ?? [])).map((node, idx) => {
          const visual = mapNodeStatusToVisual(node.node_status as JobApplyNodeStatus)
          const barClass =
            visual === 'completed'
              ? 'bg-blue-600/10'
              : visual === 'inProgress'
              ? 'bg-primary'
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


