import { IconChevronDown } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import step1Img from '@/features/referral/images/step1-1.png'
import step2Img from '@/features/referral/images/step1-2.png'
import step3Img from '@/features/referral/images/step1-3.png'

interface ReferralFlowSectionProps {
  className?: string
}

const FLOW_STEPS = [
  {
    id: 1,
    title: '查看自己的邀请码',
    description: '您可以在岗位列表直接点击"内推"标签复制邀请链接',
    subDescription: '也可以在岗位详情页复制邀请链接',
    image: step1Img,
    imageAspect: 781 / 224, // 3.49:1
  },
  {
    id: 2,
    title: '告诉您的朋友，让您的朋友在内推页面中，绑定邀请码',
    description: '',
    image: step2Img,
    imageAspect: 746 / 304, // 2.45:1
  },
  {
    id: 3,
    title: '辅导您的朋友，让他提交任务，结算后，您即可获得对应现金奖励，仅限对应岗位和',
    description: '',
    image: step3Img,
    imageAspect: 536 / 261, // 2.05:1
  },
]

export default function ReferralFlowSection({ className }: ReferralFlowSectionProps) {
  return (
    <div className={cn('w-full', className)}>
      <Collapsible defaultOpen={false} className='group'>
        {/* 切换按钮 */}
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className='flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50'
          >
            <span className='text-base font-semibold text-gray-900'>
              <span className='group-data-[state=open]:inline hidden'>点击收起内推流程说明</span>
              <span className='group-data-[state=closed]:inline hidden'>点击展开内推流程说明</span>
            </span>
            <IconChevronDown className='h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180' />
          </button>
        </CollapsibleTrigger>

        {/* 可展开/收起的内容区域 */}
        <CollapsibleContent className='CollapsibleContent'>
          <div className='mt-4 overflow-x-auto md:overflow-x-visible'>
            <div className='relative flex flex-row gap-4 md:gap-8 min-w-max md:min-w-0'>
              {FLOW_STEPS.map((step) => {
              return (
                <div key={step.id} className='relative flex-shrink-0 w-[calc(100vw-2rem)] md:flex-1 md:w-auto'>
              {/* 背景卡片 */}
              <div className='relative h-full p-2 md:p-6'>
                <div className='flex h-full flex-col'>
                  {/* 标题区域 */}
                  <div className='mb-4 flex items-start gap-2'>
                    {/* 圆形编号 */}
                    <div className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4E02E4] text-sm font-bold text-white'>
                      {step.id}
                    </div>

                    {/* 标题文字 */}
                    <h3 className='flex-1 pt-0.5 text-base font-medium leading-tight text-gray-900'>
                      {step.title}
                      {step.id === 3 && (
                        <>
                          <span className='text-[#4E02E4]'>新专家</span>
                          <span>参与</span>
                        </>
                      )}
                    </h3>
                  </div>

                  {/* 步骤3特殊布局：图片和文案左右排列 */}
                  {step.id === 3 ? (
                    <div className='flex flex-1 items-end gap-4'>
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
                            alt={step.title}
                            className='h-auto w-full object-contain'
                          />
                        </div>
                      </div>
                      
                      {/* 右下角文案 */}
                      <div className='flex flex-shrink-0 flex-col items-end pb-1'>
                        <p 
                          className='text-sm leading-[150%] tracking-[0.28px] text-[rgba(0,0,0,0.70)]'
                          style={{ fontFamily: 'PingFang SC' }}
                        >
                          *详情可见
                        </p>
                        <a 
                          href='https://meetchances.feishu.cn/wiki/UBhPw7ypki1rj3kglZwcLLUPnDb'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm leading-[150%] tracking-[0.28px] text-[#4E02E4] underline decoration-solid'
                          style={{ fontFamily: 'PingFang SC' }}
                        >
                          内推详情规则
                        </a>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 插图区域 */}
                      <div className='mb-4 flex flex-1 items-center justify-center'>
                        <div 
                          className='relative w-full'
                          style={{ 
                            maxWidth: '100%',
                            aspectRatio: step.imageAspect.toString()
                          }}
                        >
                          <img 
                            src={step.image} 
                            alt={step.title}
                            className='h-auto w-full object-contain'
                          />
                        </div>
                      </div>

                      {/* 说明文字 */}
                      <div>
                        {step.id === 1 ? (
                          <div className='flex gap-4'>
                            {step.description && (
                              <p 
                                className='flex-1 text-sm leading-[150%] tracking-[0.28px] text-[rgba(0,0,0,0.70)]'
                                style={{ fontFamily: 'PingFang SC' }}
                              >
                                {step.description}
                              </p>
                            )}
                            {step.subDescription && (
                              <p 
                                className='flex-1 text-sm leading-[150%] tracking-[0.28px] text-[rgba(0,0,0,0.70)]'
                                style={{ fontFamily: 'PingFang SC' }}
                              >
                                {step.subDescription}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className='space-y-1'>
                            {step.description && (
                              <p className='text-sm leading-[150%] text-gray-700'>
                                {step.description}
                              </p>
                            )}
                            {step.subDescription && (
                              <p className='text-sm leading-[150%] text-gray-600'>
                                {step.subDescription}
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
