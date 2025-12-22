import { IconArrowLeft } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useJobApplyProgress, JobApplyNodeStatus } from '@/features/interview/api'

// 已完成状态的自定义图标：紫色实心圆 + 对勾
function IconCircleCompleted({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      className={className}
    >
      <g clipPath='url(#clip0_7683_5034)'>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8ZM7.54347 11.424L12.1493 5.66613L11.3173 5.00053L7.38987 9.90827L4.608 7.5904L3.92533 8.4096L7.54347 11.424Z'
          fill='#4E02E4'
        />
      </g>
      <defs>
        <clipPath id='clip0_7683_5034'>
          <rect width='16' height='16' fill='white' />
        </clipPath>
      </defs>
    </svg>
  )
}

// 进行中状态的自定义图标：紫色描边 + 浅紫色填充
function IconCircleInProgress({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      className={className}
    >
      <g clipPath='url(#clip0_7683_4964)'>
        <path
          d='M8 0.5C9.98912 0.5 11.8972 1.28977 13.3037 2.69629C14.7102 4.10281 15.5 6.01088 15.5 8C15.5 9.98912 14.7102 11.8972 13.3037 13.3037C11.8972 14.7102 9.98912 15.5 8 15.5C6.01088 15.5 4.10281 14.7102 2.69629 13.3037C1.28977 11.8972 0.5 9.98912 0.5 8C0.5 6.01088 1.28977 4.10281 2.69629 2.69629C4.10281 1.28977 6.01088 0.5 8 0.5Z'
          fill='#4E02E4'
          fillOpacity='0.1'
          stroke='#4E02E4'
        />
      </g>
      <defs>
        <clipPath id='clip0_7683_4964'>
          <rect width='16' height='16' fill='white' />
        </clipPath>
      </defs>
    </svg>
  )
}

// 未开始状态的自定义图标：紫色描边（20%透明度）
function IconCircleNotStarted({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      className={className}
    >
      <g clipPath='url(#clip0_7683_5056)'>
        <path
          d='M8 0.5C9.98912 0.5 11.8972 1.28977 13.3037 2.69629C14.7102 4.10281 15.5 6.01088 15.5 8C15.5 9.98912 14.7102 11.8972 13.3037 13.3037C11.8972 14.7102 9.98912 15.5 8 15.5C6.01088 15.5 4.10281 14.7102 2.69629 13.3037C1.28977 11.8972 0.5 9.98912 0.5 8C0.5 6.01088 1.28977 4.10281 2.69629 2.69629C4.10281 1.28977 6.01088 0.5 8 0.5Z'
          stroke='#4E02E4'
          strokeOpacity='0.2'
        />
      </g>
      <defs>
        <clipPath id='clip0_7683_5056'>
          <rect width='16' height='16' fill='white' />
        </clipPath>
      </defs>
    </svg>
  )
}

// 拒绝状态的自定义图标：红色禁止标志 ⛔️
function IconCircleRejected({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      className={className}
    >
      <g clipPath='url(#clip0_rejected)'>
        <circle cx='8' cy='8' r='7.5' fill='#EF4444' stroke='#DC2626' strokeWidth='1' />
        <rect
          x='3'
          y='7'
          width='10'
          height='2'
          rx='1'
          fill='white'
        />
      </g>
      <defs>
        <clipPath id='clip0_rejected'>
          <rect width='16' height='16' fill='white' />
        </clipPath>
      </defs>
    </svg>
  )
}

interface SidebarProgressProps {
  jobApplyId: string | number | null
  onBackClick: () => void
  isMock?: boolean
}

type VisualStepStatus = 'completed' | 'inProgress' | 'reviewing' | 'notStarted' | 'rejected'

function mapNodeStatusToVisual(status: JobApplyNodeStatus): VisualStepStatus {
  switch (status) {
    case JobApplyNodeStatus.Approved:
      return 'completed'
    case JobApplyNodeStatus.InProgress:
      return 'inProgress' // 进行中
    case JobApplyNodeStatus.CompletedPendingReview:
    case JobApplyNodeStatus.AnnotateCompleted:
      return 'reviewing' // 审核中
    case JobApplyNodeStatus.NotStarted:
      return 'notStarted'
    case JobApplyNodeStatus.Rejected:
      return 'rejected'
    default:
      return 'completed'
  }
}

export function SidebarProgress({ jobApplyId, onBackClick, isMock }: SidebarProgressProps) {
  const { data, isLoading } = useJobApplyProgress(jobApplyId, Boolean(jobApplyId))

  if (!jobApplyId || isMock) return null

  const steps = data?.nodes ?? []
  const completedCount = steps.filter((node) => node.node_status === JobApplyNodeStatus.Approved).length
  const totalCount = steps.length

  return (
    <div className='flex flex-col h-full'>
      {/* 返回按钮 */}
      <button
        type='button'
        onClick={onBackClick}
        aria-label='返回个人主页'
        className='flex items-center gap-1 px-2 py-2 mb-10 border border-border rounded-lg hover:bg-accent transition-colors w-fit'
      >
        <IconArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>返回个人主页</span>
      </button>

      {/* 标题和进度 */}
      <div className='mb-4'>
        <div className='text-base font-semibold text-foreground mb-1'>您的申请</div>
        <div className='text-base flex items-center gap-1'>
          <span className='text-foreground'>已完成</span>
          <span className='text-primary font-semibold'>{completedCount}/{totalCount}</span>
        </div>
      </div>

      {/* 垂直进度条 */}
      <div className='flex flex-col gap-4'>
        {(isLoading
          ? Array.from({ length: 2 }).map((_, idx) => ({
              node_name: '加载中…',
              node_status: JobApplyNodeStatus.NotStarted,
              id: idx,
            }))
          : steps
        ).map((node, idx) => {
          const visual = mapNodeStatusToVisual(node.node_status as JobApplyNodeStatus)

          return (
            <div
              key={`${idx}-${node.node_name}`}
              className={cn(
                'flex items-center gap-4 border-l-[5px] pl-4 py-3',
                visual === 'completed'
                  ? 'border-primary'
                  : visual === 'inProgress'
                    ? 'border-primary'
                    : visual === 'reviewing'
                      ? 'border-primary'
                      : visual === 'rejected'
                        ? 'border-red-500'
                        : 'border-border'
              )}
            >
              {/* 文本 */}
              <div className='flex-1'>
                <div
                  className={cn(
                    'text-base font-semibold',
                    visual === 'notStarted'
                      ? 'text-muted-foreground'
                      : visual === 'rejected'
                        ? 'text-red-600'
                        : 'text-foreground'
                  )}
                >
                  {node.node_name}
                </div>
              </div>

              {/* 状态文案 */}
              <div className='shrink-0'>
                <span
                  className={cn(
                    'text-xs font-medium',
                    visual === 'notStarted'
                      ? 'text-muted-foreground'
                      : visual === 'rejected'
                        ? 'text-red-600'
                        : visual === 'inProgress' || visual === 'reviewing'
                          ? 'text-primary'
                          : 'text-primary'
                  )}
                >
                  {visual === 'completed'
                    ? '已通过'
                    : visual === 'inProgress'
                      ? '进行中'
                      : visual === 'reviewing'
                        ? '审核中'
                        : visual === 'rejected'
                          ? '未通过'
                          : '未开始'}
                </span>
              </div>

              {/* 右侧图标 */}
              <div className='shrink-0'>
                {visual === 'completed' ? (
                  <IconCircleCompleted className='h-4 w-4' />
                ) : visual === 'inProgress' || visual === 'reviewing' ? (
                  <IconCircleInProgress className='h-4 w-4' />
                ) : visual === 'rejected' ? (
                  <IconCircleRejected className='h-4 w-4' />
                ) : (
                  <IconCircleNotStarted className='h-4 w-4' />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

