import { cn } from '@/lib/utils'
import step1Img from '@/features/referral/images/step1.png'
import step2Img from '@/features/referral/images/step2.png'
import step3Img from '@/features/referral/images/step3.png'

interface ReferralFlowSectionProps {
  className?: string
}

const FLOW_STEPS = [
  {
    id: 1,
    title: '查看自己的推荐码',
    description: '您可以在岗位列表直接点击"内推"标签复制推荐码',
    subDescription: '也可以在岗位详情页复制邀请码',
    image: step1Img,
  },
  {
    id: 2,
    title: '告诉您的朋友，让您的朋友在内推页面中，绑定内推码',
    description: '',
    image: step2Img,
  },
  {
    id: 3,
    title: '辅导您的朋友，让他提交任务，结算后，您即可获得对应现金奖励，仅限对应岗位和新专家参与',
    description: '*详情可见内推详情规则',
    image: step3Img,
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

                {/* 插图区域 */}
                <div className='flex min-h-[120px] items-center justify-center rounded-lg bg-white/50 p-3'>
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className='h-auto w-full max-w-[200px] object-contain'
                  />
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
