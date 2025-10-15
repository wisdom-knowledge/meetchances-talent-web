import { useState, useEffect, useRef } from 'react'
import { Bell, ChevronLeft, Loader2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { fetchMessages, markMessageAsRead, fetchUnreadCount, MessageItem } from '@/lib/api'
import { imManager } from '@/lib/im'
import { cn } from '@/lib/utils'
import { sanitizeHTML } from '@/utils/sanitize-html'
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
  const navigate = useNavigate()
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const COUNT = 20

  // 获取消息列表（首次加载）
  const fetchMessagesData = async () => {
    setLoading(true)
    try {
      const response = await fetchMessages({ cursor: null, count: COUNT })
      setMessages(response.data || [])
      setHasMore(response.count === COUNT)
    } catch (_error) {
      // 静默处理错误
    } finally {
      setLoading(false)
    }
  }

  // 加载更多消息（使用游标分页）
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      // 使用最后一条消息的 message_id 作为游标
      const lastMsgId = messages.length > 0 ? messages[messages.length - 1].message_id : null
      if (lastMsgId === null) return

      const response = await fetchMessages({ cursor: lastMsgId + 1, count: COUNT })
      const newMessages = response.data || []

      setMessages((prev) => [...prev, ...newMessages])
      setHasMore(response.count === COUNT && newMessages.length > 0)
    } catch (_error) {
      // 静默处理错误
    } finally {
      setLoadingMore(false)
    }
  }

  // 标记消息为已读
  const markAsRead = async (messageId: number) => {
    try {
      // 调用后端 API 标记已读
      await markMessageAsRead(messageId)
      
      // 更新本地状态
      setMessages((prev) =>
        prev.map((msg) => (msg.message_id === messageId ? { ...msg, is_read: true } : msg))
      )
      
      // 标记已读成功后，重新获取未读数
      const newUnreadCount = await fetchUnreadCount()
      setUnreadCount(newUnreadCount)
    } catch (_error) {
      // 静默处理错误
    }
  }

  // 处理消息点击
  const handleMessageClick = async (message: MessageItem) => {
    setSelectedMessage(message)
    if (!message.is_read) {
      await markAsRead(message.message_id)
    }
  }

  // 返回消息列表
  const handleBack = () => {
    setSelectedMessage(null)
  }

  // 处理消息内容中的链接点击
  useEffect(() => {
    if (!selectedMessage || !contentRef.current) return

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A') {
        e.preventDefault()
        const href = target.getAttribute('href')
        if (href) {
          // 检查是否是站内链接
          if (href.startsWith('/')) {
            // 使用 React Router 导航
            navigate({ to: href })
            setOpen(false) // 关闭弹窗
          } else if (href.startsWith('http')) {
            // 外部链接在新窗口打开
            window.open(href, '_blank', 'noopener,noreferrer')
          }
        }
      }
    }

    const contentElement = contentRef.current
    contentElement.addEventListener('click', handleLinkClick)

    return () => {
      contentElement.removeEventListener('click', handleLinkClick)
    }
  }, [selectedMessage, navigate])

  // 监听未读数变化
  useEffect(() => {
    // 订阅 IM 的未读数变化（会自动获取一次）
    const unsubscribe = imManager.onUnreadCountChange((count) => {
      setUnreadCount(count)
    })
    return unsubscribe
  }, [])

  // 打开时获取消息列表
  useEffect(() => {
    if (open) {
      fetchMessagesData()
    } else {
      // 关闭时重置状态
      setSelectedMessage(null)
    }
  }, [open])

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

  // 消息内容区域组件（桌面端和移动端共用）
  const MessageContent = () => (
    <div
      className={cn(
        'overflow-y-auto',
        isMobile ? 'h-[calc(100vh-64px)]' : 'h-[400px]'
      )}
      onScroll={(event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement
        const scrollTop = target.scrollTop
        const scrollHeight = target.scrollHeight
        const clientHeight = target.clientHeight

        // 滚动到底部时加载更多（距离底部 50px 时触发）
        if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loadingMore && !loading) {
          loadMoreMessages()
        }
      }}
    >
      {loading ? (
        <div className={cn(
          'flex items-center justify-center text-sm text-muted-foreground',
          isMobile ? 'h-[calc(100vh-64px)]' : 'h-[400px]'
        )}>
          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          加载中...
        </div>
      ) : selectedMessage ? (
        // 消息详情视图
        <div className='p-4 space-y-4'>
          <div>
            <h4 className='font-semibold text-base mb-2'>{selectedMessage.sender_user_name}</h4>
            {selectedMessage.created_at && (
              <p className='text-xs text-muted-foreground mb-4'>
                {new Date(selectedMessage.created_at).toLocaleString('zh-CN')}
              </p>
            )}
          </div>
          <Separator />
          <div
            ref={contentRef}
            className='text-sm text-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer hover:[&_a]:text-primary/80'
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(selectedMessage.text),
            }}
          />
        </div>
      ) : (
        // 消息列表视图
        <div className='pb-2'>
          {messages.length === 0 ? (
            <div className={cn(
              'flex items-center justify-center text-sm text-muted-foreground',
              isMobile ? 'h-[calc(100vh-64px)]' : 'h-[400px]'
            )}>
              暂无通知
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={message.message_id}>
                  <button
                    onClick={() => handleMessageClick(message)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors hover:bg-accent',
                      !message.is_read && 'bg-accent/50'
                    )}
                  >
                    <div className='flex items-start gap-2'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h4 className='font-medium text-sm truncate'>{message.sender_user_name}</h4>
                          {!message.is_read && (
                            <Badge variant='destructive' className='h-4 px-1 text-[10px]'>
                              未读
                            </Badge>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground line-clamp-1'>
                          {message.text}
                        </p>
                      </div>
                    </div>
                  </button>
                  {index < messages.length - 1 && <Separator />}
                </div>
              ))}
              
              {/* 加载更多提示 */}
              {loadingMore && (
                <div className='flex items-center justify-center py-4 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  加载中...
                </div>
              )}
              
              {/* 没有更多数据提示 */}
              {!hasMore && messages.length > 0 && (
                <div className='flex items-center justify-center py-4 text-xs text-muted-foreground'>
                  已加载全部 {messages.length} 条消息
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
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
            <SheetHeader className='px-4 py-3 border-b'>
              <div className='flex items-center gap-2'>
                {selectedMessage ? (
                  <>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleBack}
                      className='h-8 w-8 p-0 mr-2'
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </Button>
                    <SheetTitle className='font-semibold text-sm'>消息详情</SheetTitle>
                  </>
                ) : (
                  <SheetTitle className='font-semibold text-sm'>通知中心</SheetTitle>
                )}
              </div>
            </SheetHeader>
            <MessageContent />
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
        {/* 头部 */}
        <div className='flex items-center justify-between px-4 py-3 border-b'>
          {selectedMessage ? (
            <>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleBack}
                className='h-8 w-8 p-0'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <h3 className='font-semibold text-sm'>消息详情</h3>
            </>
          ) : (
            <h3 className='font-semibold text-sm'>通知中心</h3>
          )}
        </div>

        <MessageContent />
      </PopoverContent>
    </Popover>
  )
}

