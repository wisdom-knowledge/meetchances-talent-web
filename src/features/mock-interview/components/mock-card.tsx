// tooltip 取消，直接展示截断
import type { MockInterviewItem } from '@/features/mock-interview/types'

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
}

import { useNavigate } from '@tanstack/react-router'

export default function MockCard({ item, index }: MockCardProps) {
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
          <span className='inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px]'>
            <span>⏱</span>
            <span>{item.durationMinutes}分钟</span>
          </span>
        </div>
      </div>

      {/* 下方内容区域：白色背景
          - 移动端：始终 144px，按钮常显
          - ≥sm：默认 104px，hover 变 144px
      */}
      <div className='bg-white overflow-hidden'>
        <div className='h-[144px] sm:h-[104px] sm:group-hover:h-[144px] transition-all duration-300 ease-out p-5 pt-4 relative'>
          <div className='flex flex-col h-full'>
            <div className='mt-[4px] font-semibold text-[16px] leading-[24px]'>{item.title}</div>
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


