import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface ReferralFlowSectionProps {
  className?: string
}

type FlowStep = {
  id: number
  title: string
  description: string
  status: 'completed' | 'current' | 'upcoming'
}

// 推荐流程步骤
const REFERRAL_FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: '分享邀请码',
    description: '将你的专属邀请码分享给朋友',
    status: 'current',
  },
  {
    id: 2,
    title: '好友注册',
    description: '好友使用邀请码完成注册',
    status: 'upcoming',
  },
  {
    id: 3,
    title: '完成任务',
    description: '好友完成指定的内推任务要求',
    status: 'upcoming',
  },
  {
    id: 4,
    title: '获得奖励',
    description: '审核通过后，内推奖励发放到钱包',
    status: 'upcoming',
  },
]

// 已完成状态的自定义图标：紫色实心圆 + 对勾
function IconCircleCompleted({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      className={className}
    >
      <circle cx='10' cy='10' r='10' fill='#4E02E4' />
      <path
        d='M14.5 7L8.5 13L5.5 10'
        stroke='white'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// 进行中状态的自定义图标：紫色实心圆 + 白色边框
function IconCircleCurrent({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      className={className}
    >
      <circle cx='10' cy='10' r='9' fill='#4E02E4' stroke='white' strokeWidth='2' />
      <circle cx='10' cy='10' r='4' fill='white' />
    </svg>
  )
}

// 待完成状态的自定义图标：灰色空心圆
function IconCircleUpcoming({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      className={className}
    >
      <circle
        cx='10'
        cy='10'
        r='9'
        stroke='#D1D5DB'
        strokeWidth='2'
        fill='white'
      />
    </svg>
  )
}

export default function ReferralFlowSection({ className }: ReferralFlowSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white', className)}>
      {/* 标题行 - 可点击折叠/展开 */}
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center justify-between px-6 py-4 text-left',
          isExpanded && 'border-b border-gray-100'
        )}
      >
        <span className='text-base font-semibold text-foreground'>推荐流程</span>
        <div className='flex items-center gap-2'>
          {isExpanded ? (
            <IconChevronUp className='h-5 w-5 text-muted-foreground' />
          ) : (
            <IconChevronDown className='h-5 w-5 text-muted-foreground' />
          )}
        </div>
      </button>

      {/* 流程列表 - 可折叠 */}
      {isExpanded && (
        <div className='px-6 py-5'>
          <div className='relative'>
            {REFERRAL_FLOW_STEPS.map((step, index) => {
              const isLast = index === REFERRAL_FLOW_STEPS.length - 1

              return (
                <div key={step.id} className='relative flex gap-4 pb-8 last:pb-0'>
                  {/* 连接线 */}
                  {!isLast && (
                    <div className='absolute left-[10px] top-[28px] h-[calc(100%-8px)] w-[2px] bg-gray-200' />
                  )}

                  {/* 图标 */}
                  <div className='relative z-10 flex-shrink-0 pt-0.5'>
                    {step.status === 'completed' ? (
                      <IconCircleCompleted />
                    ) : step.status === 'current' ? (
                      <IconCircleCurrent />
                    ) : (
                      <IconCircleUpcoming />
                    )}
                  </div>

                  {/* 内容 */}
                  <div className='flex-1 space-y-1 pt-0.5'>
                    <h4
                      className={cn(
                        'text-sm font-semibold leading-none',
                        step.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                      )}
                    >
                      {step.title}
                    </h4>
                    <p className='text-xs text-muted-foreground leading-relaxed'>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

