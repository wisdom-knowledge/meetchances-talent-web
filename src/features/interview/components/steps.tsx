import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useJobApplyProgress, JobApplyNodeStatus } from '@/features/interview/api'
import { useIsMobile } from '@/hooks/use-mobile'

interface StepsProps {
  jobApplyId: string | number | null
  className?: string
  isMock?: boolean
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
    case JobApplyNodeStatus.AnnotateCompleted:
      return 'inProgress'
    // 未开始：0
    case JobApplyNodeStatus.NotStarted:
      return 'notStarted'
    // 其他状态（如 40、50）暂按已完成处理，避免样式缺省
    default:
      return 'completed'
  }
}

// PC 端组件
function DesktopSteps({ 
  steps, 
  isLoading 
}: { 
  steps: Array<{ node_name: string; node_status: JobApplyNodeStatus }> 
  isLoading: boolean
}) {
  return (
    <div className='flex items-center gap-6'>
      {(isLoading 
        ? Array.from({ length: 2 }).map(() => ({ 
            node_name: '加载中…', 
            node_status: JobApplyNodeStatus.NotStarted 
          })) 
        : steps
      ).map((node, idx) => {
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
            <div className={cn('text-sm font-medium mb-2 text-center py-2', labelClass)}>
              {node.node_name}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 移动端组件
function MobileSteps({ 
  steps, 
  isLoading 
}: { 
  steps: Array<{ node_name: string; node_status: JobApplyNodeStatus }> 
  isLoading: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inProgressRef = useRef<HTMLDivElement>(null)

  // 滚动到进行中的 item
  useEffect(() => {
    if (!isLoading && steps && inProgressRef.current && containerRef.current) {
      const container = containerRef.current
      const element = inProgressRef.current
      const elementLeft = element.offsetLeft
      const elementWidth = element.offsetWidth
      const containerWidth = container.offsetWidth
      
      // 将元素滚动到容器中央
      const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2)
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
    }
  }, [isLoading, steps])

  const displaySteps = isLoading 
    ? Array.from({ length: 2 }).map(() => ({ 
        node_name: '加载中…', 
        node_status: JobApplyNodeStatus.NotStarted 
      })) 
    : steps

  return (
    <div 
      ref={containerRef}
      className='flex items-center overflow-x-auto  [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden'
    >
      {displaySteps.map((node, idx) => {
        const visual = mapNodeStatusToVisual(node.node_status as JobApplyNodeStatus)
        const isInProgress = visual === 'inProgress'
        const isLastStep = idx === displaySteps.length - 1
        
        // 数字圆形样式
        const numberBgClass =
          visual === 'completed'
            ? 'bg-[#4E02E4]'
            : visual === 'inProgress'
            ? 'bg-[#C994F7]'
            : 'bg-[#A1A1A1]'
        
        // 胶囊样式
        const pillBgClass =
          visual === 'completed' || visual === 'inProgress'
            ? 'bg-[rgba(78,2,228,0.10)]'
            : 'bg-[rgba(0,0,0,0.10)]'
        
        const pillTextClass =
          visual === 'completed' || visual === 'inProgress'
            ? 'text-[#4E02E4]'
            : 'text-[#000000]'

        // 连线颜色：根据下一个step的状态
        let lineClass = 'bg-[#DEDEDE]'
        if (!isLastStep) {
          const nextNode = displaySteps[idx + 1]
          const nextVisual = mapNodeStatusToVisual(nextNode.node_status as JobApplyNodeStatus)
          lineClass = 
            nextVisual === 'completed'
              ? 'bg-[rgba(78,2,228,0.10)]'
              : nextVisual === 'inProgress'
              ? 'bg-[#C994F7]'
              : 'bg-[#DEDEDE]'
        }

        return (
          <div 
            key={`${idx}-${node.node_name}`} 
            ref={isInProgress ? inProgressRef : null}
            className='flex items-center shrink-0'
          >
            {/* 步骤项容器 */}
            <div className='flex items-center'>
              {/* 数字圆形 */}
              <div 
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium leading-[1.3] shrink-0',
                  numberBgClass
                )}
              >
                {idx + 1}
              </div>
              
              {/* 胶囊文字 */}
              <div 
                className={cn(
                  'px-3 py-0.5 rounded-full text-sm whitespace-nowrap',
                  pillBgClass,
                  pillTextClass
                )}
              >
                {node.node_name}
              </div>
            </div>

            {/* 连线（最后一个步骤不显示） */}
            {!isLastStep && (
              <div 
                className={cn('h-[4px] w-12 rounded-full shrink-0 mx-2', lineClass)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function Steps({ jobApplyId, className, isMock }: StepsProps) {
  const { data, isLoading } = useJobApplyProgress(jobApplyId, Boolean(jobApplyId))
  const isMobile = useIsMobile()

  if (!jobApplyId || isMock) return null

  const steps = data?.nodes ?? []

  return (
    <div className={cn('mt-2', className)}>
      {isMobile ? (
        <MobileSteps steps={steps} isLoading={isLoading} />
      ) : (
        <DesktopSteps steps={steps} isLoading={isLoading} />
      )}
    </div>
  )
}


