// tooltip 取消，直接展示截断
import type { MockInterviewItem } from '@/features/mock-interview/types'
import { IconDeviceLaptop } from '@tabler/icons-react'

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

export default function MockCard({ item, index, categories }: MockCardProps) {
  const navigate = useNavigate()
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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1.125C6.18985 1.125 6.34675 1.26608 6.37158 1.44911L6.375 1.5V2.5C6.375 2.70711 6.20711 2.875 6 2.875C5.81015 2.875 5.65325 2.73392 5.62842 2.55089L5.625 2.5V1.5C5.625 1.29289 5.79289 1.125 6 1.125Z" fill="#4E02E4"/>
              <path d="M6 1.125C8.69261 1.125 10.875 3.30739 10.875 6C10.875 8.69261 8.69261 10.875 6 10.875C3.30739 10.875 1.125 8.69261 1.125 6C1.125 5.39634 1.23903 4.8045 1.45672 4.2413C1.53139 4.04812 1.74852 3.95205 1.9417 4.02672C2.13488 4.10139 2.23095 4.31852 2.15628 4.5117C1.9714 4.99 1.875 5.49036 1.875 6C1.875 8.27839 3.72161 10.125 6 10.125C8.27839 10.125 10.125 8.27839 10.125 6C10.125 3.72161 8.27839 1.875 6 1.875C5.79289 1.875 5.625 1.70711 5.625 1.5C5.625 1.29289 5.79289 1.125 6 1.125Z" fill="#4E02E4"/>
              <path d="M2.55466 2.5549C2.68779 2.42177 2.89612 2.40967 3.04293 2.51859L3.08499 2.5549L5.55999 5.0299C5.70644 5.17635 5.70644 5.41379 5.55999 5.56023C5.42686 5.69337 5.21852 5.70547 5.07172 5.59654L5.02966 5.56023L2.55466 3.08523C2.40821 2.93879 2.40821 2.70135 2.55466 2.5549Z" fill="#4E02E4"/>
              <path d="M5.02783 5.02783C5.5648 4.49086 6.4352 4.49086 6.97217 5.02783C7.50904 5.56481 7.5091 6.43523 6.97217 6.97217C6.43523 7.5091 5.56481 7.50904 5.02783 6.97217C4.49086 6.4352 4.49086 5.5648 5.02783 5.02783ZM6.39111 5.51221C6.14569 5.31484 5.78589 5.33032 5.55811 5.55811C5.31403 5.80218 5.31403 6.19782 5.55811 6.44189C5.80219 6.68587 6.19785 6.68594 6.44189 6.44189C6.66961 6.21418 6.68497 5.8543 6.48779 5.60889L6.44189 5.55811L6.39111 5.51221Z" fill="#4E02E4"/>
            </svg>
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
          - 移动端：始终 144px，按钮常显
          - ≥sm：默认 104px，hover 变 144px
      */}
      <div className='bg-white overflow-hidden'>
        <div className='h-[144px] sm:h-[104px] sm:group-hover:h-[144px] transition-all duration-300 ease-out p-5 pt-4 relative'>
          <div className='h-full'>
            <div className='mt-[4px] font-semibold text-[16px] leading-[24px] line-clamp-1'>{item.title}</div>
            <div 
              className='mt-[4px] text-[12px] leading-[18px] text-muted-foreground line-clamp-2 h-[36px] overflow-hidden flex-shrink-0'
              dangerouslySetInnerHTML={{ __html: item.summary || '' }}
            />
            <div className='mt-3 flex-1 flex items-end'>
              <button
                className='h-7 w-full inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#4E02E4] to-[#C994F7] px-3 text-white text-sm shadow opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 ease-out'
                onClick={() => {
                  navigate({
                    to: `/jobs/${item.id}`,
                  }).catch(() => {})
                }}
              >
                开始面试
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


