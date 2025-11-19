import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import heliImage from '@/features/referral/images/heli.png'

interface ShareBubbleProps {
  totalIncome: number
  onGeneratePoster: () => void
  className?: string
  mobileInline?: boolean // 移动端是否显示为内联元素（非固定定位）
}

export default function ShareBubble({ onGeneratePoster, className, mobileInline = false }: ShareBubbleProps) {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <div className={cn(
      mobileInline 
        ? 'relative flex justify-end md:fixed md:right-16 md:top-5 md:z-40' 
        : 'fixed right-2 top-3 z-40 md:right-16 md:top-5',
      className
    )}>
      {/* 动物形象和气泡框的容器 */}
      <div className='relative flex items-center justify-end'>
        {/* 气泡框 - 在动物左侧 */}
        <Card
          className={cn(
            'relative mr-2 w-auto max-w-[160px] border-2 border-purple-200 bg-white shadow-xl transition-all duration-300',
            'md:mr-3 md:max-w-[220px]',
            'before:absolute before:-right-2 before:top-1/2 before:h-0 before:w-0 before:-translate-y-1/2',
            'before:border-l-[10px] before:border-t-[10px] before:border-b-[10px]',
            'before:border-r-transparent before:border-l-purple-200 before:border-t-transparent before:border-b-transparent',
            'md:before:-right-3 md:before:border-l-[14px] md:before:border-t-[14px] md:before:border-b-[14px]',
            'after:absolute after:-right-[7px] after:top-1/2 after:h-0 after:w-0 after:-translate-y-1/2',
            'after:border-l-[10px] after:border-t-[10px] after:border-b-[10px]',
            'after:border-r-transparent after:border-l-white after:border-t-transparent after:border-b-transparent',
            'md:after:-right-[10px] md:after:border-l-[14px] md:after:border-t-[14px] md:after:border-b-[14px]',
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          )}
        >
          <div className='p-2 md:p-3'>
            <div className='space-y-1 text-xs text-gray-700 md:text-sm'>
              <p>
                <button
                  onClick={onGeneratePoster}
                  className='font-medium text-purple-600 underline decoration-purple-300 underline-offset-2 transition-colors hover:text-purple-700 hover:decoration-purple-400'
                >
                  分享
                </button>
                历史收益，
              </p>
              <p>邀请好友赢内推奖</p>
            </div>
          </div>
        </Card>

        {/* 紫色小熊形象 - 响应式大小 */}
        <div 
          className='relative flex-shrink-0 cursor-pointer transition-transform hover:scale-105'
          onClick={() => setIsVisible(!isVisible)}
        >
          <img 
            src={heliImage} 
            alt='内推助手' 
            className='h-28 w-28 object-contain drop-shadow-lg md:h-52 md:w-52'
          />
          {/* 小提示 */}
          {!isVisible && (
            <div className='absolute -left-2 top-1/2 -translate-y-1/2 animate-bounce'>
              <div className='rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-lg'>
                点我
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

