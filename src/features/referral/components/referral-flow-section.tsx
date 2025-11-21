import { cn } from '@/lib/utils'

interface ReferralFlowSectionProps {
  className?: string
}

const FLOW_STEPS = [
  {
    id: 1,
    title: '查看自己的推荐码',
    description: '您可以在岗位列表直接点击"内推"标签复制推荐码',
    subDescription: '也可以在岗位详情页复制邀请码',
  },
  {
    id: 2,
    title: '告诉您的朋友，让您的朋友在内推页面中，绑定内推码',
    description: '',
  },
  {
    id: 3,
    title: '辅导您的朋友，让他提交任务，结算后，您即可获得对应现金奖励，仅限对应岗位和新专家参与',
    description: '*详情可见内推详情规则',
  },
]

export default function ReferralFlowSection({ className }: ReferralFlowSectionProps) {
  return (
    <div className={cn('rounded-lg border border-[#E0E7FF] bg-gradient-to-r from-[#F5F3FF] via-white to-[#FAF5FF] p-6 md:p-8', className)}>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8'>
        {FLOW_STEPS.map((step, index) => {
          const isLast = index === FLOW_STEPS.length - 1

          return (
            <div key={step.id} className='relative flex flex-col'>
              {/* 斜线分隔符（桌面端） */}
              {!isLast && (
                <div className='absolute -right-4 top-1/2 hidden h-[80%] w-[1px] -translate-y-1/2 rotate-12 bg-gradient-to-b from-transparent via-[#C4B5FD] to-transparent md:block' />
              )}

              <div className='flex flex-col space-y-3'>
                {/* 标题区域 */}
                <div className='flex items-start gap-3'>
                  {/* 圆形编号 */}
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4E02E4] to-[#8B5CF6] text-sm font-bold text-white shadow-md'>
                    {step.id}
                  </div>

                  {/* 标题文字 */}
                  <h3 className='flex-1 pt-1 text-sm font-semibold leading-tight text-gray-900'>
                    {step.title}
                  </h3>

                  {/* Auto 标签（仅第2和第3步显示） */}
                  {step.id !== 1 && (
                    <div className='flex-shrink-0 rounded bg-[#4E02E4] px-2 py-0.5 text-xs font-medium text-white'>
                      Auto
                    </div>
                  )}
                </div>

                {/* 插图占位区域 */}
                <div className='flex min-h-[100px] items-center justify-center rounded-lg bg-white/50 p-4'>
                  {/* 这里可以放置插图，目前用占位符 */}
                  <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E0E7FF] to-[#DDD6FE]'>
                    <svg
                      className='h-10 w-10 text-[#4E02E4]'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      {step.id === 1 && (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        />
                      )}
                      {step.id === 2 && (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                        />
                      )}
                      {step.id === 3 && (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      )}
                    </svg>
                  </div>
                </div>

                {/* 说明文字 */}
                <div className='space-y-1'>
                  {step.description && (
                    <p className='text-xs leading-relaxed text-gray-600'>
                      {step.description}
                    </p>
                  )}
                  {step.subDescription && (
                    <p className='text-xs leading-relaxed text-gray-500'>
                      {step.subDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
