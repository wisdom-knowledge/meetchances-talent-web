// tooltip 取消，直接展示截断
import type { MockInterviewItem } from '@/features/mock-interview/types'
import { IconDeviceLaptop } from '@tabler/icons-react'
import { useIsMobile } from '@/hooks/use-mobile'
import clockIcon from '@/assets/images/clock-icon.svg'

function gradientClassByIndex(index: number): string {
  const i = index % 9
  switch (i) {
    case 0: return 'bg-[linear-gradient(71.23deg,_rgba(78,2,228,0.15)_6.59%,_rgba(39,205,241,0.15)_92.3%)]'
    case 1: return 'bg-[linear-gradient(71.23deg,_rgba(78,2,228,0.15)_6.59%,_rgba(201,148,247,0.15)_92.3%)]'
    case 2: return 'bg-[linear-gradient(71.23deg,_rgba(78,2,228,0.15)_6.59%,_rgba(95,254,235,0.15)_92.3%)]'
    case 3: return 'bg-[linear-gradient(71.23deg,_rgba(95,254,235,0.15)_6.59%,_rgba(78,2,228,0.15)_92.3%)]'
    case 4: return 'bg-[linear-gradient(71.23deg,_rgba(39,205,241,0.15)_6.59%,_rgba(78,2,228,0.15)_92.3%)]'
    case 5: return 'bg-[linear-gradient(71.23deg,_rgba(201,148,247,0.15)_6.59%,_rgba(95,254,235,0.15)_92.3%)]'
    case 6: return 'bg-[linear-gradient(71.23deg,_rgba(201,148,247,0.15)_6.59%,_rgba(39,205,241,0.15)_92.3%)]'
    case 7: return 'bg-[linear-gradient(71.23deg,_rgba(39,205,241,0.15)_6.59%,_rgba(201,148,247,0.15)_92.3%)]'
    default: return 'bg-[linear-gradient(71.23deg,_rgba(95,254,235,0.15)_6.59%,_rgba(39,205,241,0.15)_92.3%)]'
  }
}


export interface MockCardProps {
  item: MockInterviewItem
  index: number
  categories: Array<{ id: number; icon?: string }>
}

import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

export default function MockCard({ item, index, categories }: MockCardProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const titleRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const [summaryLineClamp, setSummaryLineClamp] = useState(2)

  useEffect(() => {
    if (titleRef.current && summaryRef.current) {
      const titleHeight = titleRef.current.offsetHeight
      const lineHeight = 18 // 12px font-size with 1.5 line-height = 18px
      const availableHeight = 66 - 4 - titleHeight // 总高度 - margin-top - title高度
      const maxLines = Math.floor(availableHeight / lineHeight)
      setSummaryLineClamp(Math.max(1, maxLines))
    }
  }, [item.title])

  // 移动端卡片样式
  if (isMobile) {
    return (
      <div
        className="group relative flex h-[120px] w-full flex-col overflow-hidden rounded-xl border transition-shadow cursor-pointer border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A] hover:border-[#4E02E4] hover:shadow-[0_0_12px_0_#4E02E433]"
        onClick={() => {
          navigate({
            to: `/jobs/${item.id}`,
          }).catch(() => {})
        }}
      >
        {/* 渐变背景 */}
        <div className={['relative flex-1 w-full p-4', gradientClassByIndex(index)].join(' ')}>
          {/* 顶部标题 */}
          <div className="absolute left-4 right-4 top-4 z-10">
            <div className="font-medium text-[14px] leading-[21px] text-black line-clamp-2">
              {item.title}
            </div>
          </div>
          
          {/* 右下角时间标签 */}
          <div className='absolute right-4 bottom-4 z-10 flex items-center gap-1 rounded-full bg-white px-2 py-1'>
            <img src={clockIcon} alt="时钟图标" className="w-3 h-3" />
            <span className="text-[9px] font-medium text-[#4E02E4]">{item.durationMinutes}分钟</span>
          </div>
          
          {/* 左下角分类图标 */}
          <div className='absolute left-4 bottom-4 z-10'>
            <div className='flex h-7 w-7 items-center justify-center'>
              {(() => {
                const categoryData = categories.find(cat => cat.id === item.category_id)
                const categoryIcon = categoryData?.icon
                
                return categoryIcon ? (
                  <span
                    className='h-7 w-7 drop-shadow-sm'
                    style={{
                      backgroundColor: '#C994F7B2',
                      WebkitMaskImage: `url(${categoryIcon})`,
                      maskImage: `url(${categoryIcon})`,
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                    }}
                  />
                ) : (
                  <IconDeviceLaptop className='h-7 w-7 text-white drop-shadow-sm' />
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 桌面端保持原有样式
  return (
    <div
      className={[
        'group relative flex h-[224px] flex-col overflow-hidden rounded-xl border transition-shadow',
        'border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A]',
        'hover:border-[#4E02E4] hover:shadow-[0_0_12px_0_#4E02E433]',
      ].join(' ')}
    >
      {/* 上方占位背景：flex:1 */}
      <div className={['relative flex-1 w-full', gradientClassByIndex(index)].join(' ')}>
        {/* 左上角分钟徽标（距上/左16px） */}
        <div className='absolute left-4 top-4 z-10 flex items-center gap-2 text-primary/80 text-xs'>
          <span className='inline-flex items-center gap-1 rounded-full bg-white/50 px-2 py-0.5 text-[11px]'>
            <img src={clockIcon} alt="时钟图标" className="w-3 h-3" />
            <span>{item.durationMinutes}分钟</span>
          </span>
        </div>
        
        {/* 右上角分类图标（距上/右16px） */}
        <div className='absolute right-4 top-4 z-10'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#4E02E4]/20 backdrop-blur-sm'>
            {(() => {
              // 根据 item.category_id 找到对应的分类图标
              const categoryData = categories.find(cat => cat.id === item.category_id)
              const categoryIcon = categoryData?.icon
              
              return categoryIcon ? (
                <span
                  className='h-6 w-6 bg-white drop-shadow-sm'
                  style={{
                    WebkitMaskImage: `url(${categoryIcon})`,
                    maskImage: `url(${categoryIcon})`,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                  }}
                />
              ) : (
                <IconDeviceLaptop className='h-6 w-6 text-white drop-shadow-sm' />
              )
            })()}
          </div>
        </div>
      </div>

      {/* 下方内容区域：白色背景
          - 移动端：始终 146px，按钮常显
          - ≥sm：默认 104px，hover 变 146px
      */}
      <div className='bg-white overflow-hidden'>
        <div className='h-[146px] sm:h-[106px] sm:group-hover:h-[146px] transition-all duration-300 ease-out p-[20px] pb-[20px] relative'>
          <div className='h-full'>
            <div className='flex-1 h-[66px] flex flex-col min-h-0'>
              <div 
                ref={titleRef}
                className='font-semibold text-[16px] leading-[24px] line-clamp-2 flex-shrink-0 break-all'
              >
                {item.title}
              </div>
              <div 
                ref={summaryRef}
                className='mt-[4px] text-[12px] leading-[18px] text-muted-foreground flex-1 min-h-0 overflow-hidden break-all'
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: summaryLineClamp,
                }}
                dangerouslySetInnerHTML={{ __html: item.summary || '' }}
              />
            </div>
            <div className='mt-[12px] flex-1 flex items-end'>
              <button
                className='h-[28px] w-full inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#4E02E4] to-[#C994F7] px-[12px] text-white text-sm shadow opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 ease-out'
                onClick={() => {
                  navigate({
                    to: `/jobs/${item.id}`,
                  }).catch(() => {})
                }}
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


