import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { NotificationContent, useUnreadCount } from '@/components/notification-content'
import { useIsMobile } from '@/hooks/use-mobile'



/**
 * 通知中心组件属性
 */
interface NotificationCenterProps {
  /** 自定义触发按钮 */
  trigger?: React.ReactNode
  /** 是否显示未读数徽章 */
  showBadge?: boolean
}

/**
 * 通知中心组件
 * 提供消息列表和消息详情查看功能
 */
export function NotificationCenter({ trigger, showBadge = true }: NotificationCenterProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const unreadCount = useUnreadCount()

  // 默认触发按钮 - 与其他菜单按钮样式保持一致
  const defaultTrigger = (
    <button
      className='relative flex flex-col items-center justify-center gap-1 py-3 px-1 w-full rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      aria-label='通知中心'
    >
      <Bell className='h-6 w-6 flex-shrink-0' />
      <span className='text-[10px] font-medium text-center leading-tight'>通知</span>
      {showBadge && unreadCount > 0 && (
        <Badge
          variant='destructive'
          className='absolute top-1 right-1 h-4 px-1 text-[9px]'
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </button>
  )

  // 移动端：使用全屏 Sheet
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className='flex items-center gap-3 py-3 px-4 w-full rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          aria-label='通知中心'
        >
          <div className='relative'>
            <Bell className='h-6 w-6 flex-shrink-0' />
            {showBadge && unreadCount > 0 && (
              <Badge
                variant='destructive'
                className='absolute -top-1 -right-1 h-4 px-1 text-[9px]'
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <span className='text-sm font-medium'>通知</span>
        </button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side='bottom' className='h-full w-full p-0'>
            <NotificationContent
              showBackButton={true}
              showHeader={false}
              containerClassName='h-full'
              contentHeight='h-[calc(100vh-64px)]'
            />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // 桌面端：使用 Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
      <PopoverContent
        side='right'
        align='end'
        className='w-[380px] p-0'
        sideOffset={8}
      >
        <NotificationContent
          showBackButton={true}
          showHeader={true}
          contentHeight='h-[400px]'
        />
      </PopoverContent>
    </Popover>
  )
}

