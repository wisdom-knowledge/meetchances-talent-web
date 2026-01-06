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
    image: step1Img,
    imageAspect: 781 / 224, // 3.49:1
  },
  {
    id: 2,
    description: '',
    image: step2Img,
    imageAspect: 746 / 304, // 2.45:1
  },
  {
    id: 3,
    description: '',
    image: step3Img,
    imageAspect: 536 / 261, // 2.05:1
  },
]

export default function ReferralFlowSection({ className }: ReferralFlowSectionProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className='relative flex flex-col gap-4 md:flex-row md:gap-8'>
        {FLOW_STEPS.map((step) => {
          return (
            <div key={step.id} className='relative flex-1'>
              {/* 背景卡片 */}
              <div className='relative h-full p-2 md:p-6'>
                <div className='flex h-full flex-col'>
                  {/* 标题区域 */}
                  <div className='mb-4 flex items-start gap-2'>
                    {/* 圆形标识 */}
                    <div className='h-2 w-2 flex-shrink-0 mt-1.5 rounded-full bg-[#4E02E4]' />

                    {/* 标题文字 */}
                    <h3 className='flex-1 text-base font-medium leading-tight text-gray-900'>
                      {step.id === 1 ? (
                        <>
                          专家会被绑定到<span className='text-[#4E02E4]'>最先完成</span>的内推任务的项目上
                        </>
                      ) : step.id === 2 ? (
                        <>
                          如果专家完成被绑定项目的<span className='text-[#4E02E4]'>多个任务，推荐人可以获得</span>多份奖励
                        </>
                      ) : step.id === 3 ? (
                        <>
                          一个专家<span className='text-[#4E02E4]'>只能触发一个</span>项目的内推奖，不能同时获得多个项目的奖励
                        </>
                      ) : null}
                    </h3>
                  </div>

                  {/* 步骤3特殊布局：图片和文案左右排列 */}
                  {step.id === 3 ? (
                    <div className='flex flex-1 items-end gap-4 md:mt-[25px]'>
                      {/* 左侧图片 */}
                      <div className='flex-1'>
                        <div 
                          className='relative w-full'
                          style={{ 
                            maxWidth: '100%',
                            aspectRatio: step.imageAspect.toString()
                          }}
                        >
                          <img 
                            src={step.image} 
                            alt={`步骤${step.id}示意图`}
                            className='h-auto w-full object-contain'
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 插图区域 */}
                      <div className='mb-4 flex flex-1 items-center justify-center md:mt-[25px]'>
                        <div 
                          className='relative w-full'
                          style={{ 
                            maxWidth: '100%',
                            aspectRatio: step.imageAspect.toString()
                          }}
                        >
                          <img 
                            src={step.image} 
                            alt={`步骤${step.id}示意图`}
                            className='h-auto w-full object-contain'
                          />
                        </div>
                      </div>

                      {/* 说明文字 */}
                      <div>
                        {step.id === 1 ? (
                          <div className='flex gap-4'>
                            {(step as { description?: string }).description && (
                              <p 
                                className='flex-1 text-sm leading-[150%] tracking-[0.28px] text-[rgba(0,0,0,0.70)]'
                                style={{ fontFamily: 'PingFang SC' }}
                              >
                                {(step as { description: string }).description}
                              </p>
                            )}
                            {((step as unknown) as { subDescription?: string }).subDescription && (
                              <p 
                                className='flex-1 text-sm leading-[150%] tracking-[0.28px] text-[rgba(0,0,0,0.70)]'
                                style={{ fontFamily: 'PingFang SC' }}
                              >
                                {((step as unknown) as { subDescription: string }).subDescription}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className='space-y-1'>
                            {(step as { description?: string }).description && (
                              <p className='text-sm leading-[150%] text-gray-700'>
                                {(step as { description: string }).description}
                              </p>
                            )}
                            {((step as unknown) as { subDescription?: string }).subDescription && (
                              <p className='text-sm leading-[150%] text-gray-600'>
                                {((step as unknown) as { subDescription: string }).subDescription}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
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
