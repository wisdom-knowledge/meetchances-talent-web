import { Link } from '@tanstack/react-router'
import finishBg from '@/assets/images/icons/finish-bg.svg'
import ingBg from '@/assets/images/icons/ing-bg.svg'
import iconLock from '@/assets/images/icons/lock.svg'
import iconRight from '@/assets/images/icons/right.svg'
import iconUnlock from '@/assets/images/icons/unlock.svg'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { StudyModuleItem } from '../api'

export interface StudyCardProps {
  item: StudyModuleItem
  index: number
  locked: boolean
}

export function StudyCard({ item, index: _index, locked }: StudyCardProps) {
  // 固定尺寸 243x133（不含外边距）
  const sizeClass = 'w-[243px] h-[133px]'
  const baseCard = cn(
    'relative overflow-hidden border-none shadow-none ring-1 ring-black/5 p-5',
    sizeClass
  )
  const visualByStatus: Record<1 | 2 | 3, string> = {
    // 未开始：灰底与灰字
    1: 'bg-[#EFEFEF] text-[#808080]',
    // 进行中：浅紫底与白字
    2: 'bg-[#E0C1FA] text-white',
    // 已完成：品牌紫底与白字
    3: 'bg-[#C994F7] text-white',
  }
  const cardClass = cn(
    baseCard,
    visualByStatus[item.status],
    (item.status === 2 || item.status === 3) && 'shadow-[0_0_12px_#4E02E433]'
  )
  const statusIconSrc =
    item.status === 3 ? iconRight : item.status === 2 ? iconUnlock : iconLock

  const firstValidTask = Array.isArray(item.tasks)
    ? item.tasks.find((t) => t && t.task_id !== undefined && t.task_id !== null)
    : undefined
  const gotoTaskId = firstValidTask?.task_id
  // 已完成的模块始终可点击进入重新学习；否则需解锁
  const clickable = item.status === 3 || !locked

  const cardBody = (
    <Card
      className={cn(
        cardClass,
        clickable ? 'cursor-pointer' : 'cursor-default',
        'relative z-10'
      )}
    >
      <CardContent className='p-0'>
        <div className='flex items-start justify-between'>
          <div className='min-w-0'>
            <div className='truncate text-[24px] leading-tight font-semibold'>
              {item.title}
            </div>
            <p
              className={cn(
                'mt-4 line-clamp-2 text-[16px] leading-snug',
                item.status === 1 ? 'text-[#808080]' : 'text-white/90'
              )}
            >
              {item.desc}
            </p>
          </div>
          <img
            src={statusIconSrc}
            alt=''
            className='ml-3 h-[29px] w-[29px] shrink-0 select-none'
          />
        </div>
      </CardContent>

      {/* 已完成卡片的背景图 */}
      {item.status === 3 && (
        <img
          src={finishBg}
          alt=''
          className='pointer-events-none absolute right-0 bottom-0 z-0 select-none'
        />
      )}
      {/* 进行中卡片的背景图 */}
      {item.status === 2 && (
        <img
          src={ingBg}
          alt=''
          className='pointer-events-none absolute right-0 bottom-0 select-none'
        />
      )}

      {locked && item.status === 2 && (
        <div className='absolute inset-0 grid place-items-center bg-white/70'>
          <div className='text-muted-foreground flex items-center gap-2'>
            <img src={iconLock} alt='' className='h-[29px] w-[29px]' />
            <span>完成前一模块后解锁</span>
          </div>
        </div>
      )}
    </Card>
  )

  if (clickable && gotoTaskId !== undefined) {
    return (
      <Link to='/study/task' search={{ id: gotoTaskId }} className='block'>
        {cardBody}
      </Link>
    )
  }

  return cardBody
}
