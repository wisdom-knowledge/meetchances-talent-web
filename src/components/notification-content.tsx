import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { fetchMessages, markMessageAsRead, fetchUnreadCount, MessageItem } from '@/lib/api'
import { imManager } from '@/lib/im'
import { cn } from '@/lib/utils'
import { sanitizeHTML } from '@/utils/sanitize-html'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuthStore } from '@/stores/authStore'

/**
 * 将文本中的自定义链接格式转换为可点击的 HTML 链接
 * 支持以下格式：
 * 
 * 1. 带自定义文字：{link=https://example.com}点击这里{/link}
 *    → <a href="https://example.com" target="_blank">点击这里</a>
 * 
 * 2. 不带自定义文字：{link=https://example.com}
 *    → <a href="https://example.com" target="_blank">https://example.com</a>
 * 
 * 3. 站内链接：{link=/jobs/123}查看详情{/link}
 *    → <a href="/jobs/123">查看详情</a>
 * 
 * 注意：
 * - 外部链接（http/https）会在新窗口打开
 * - 站内链接（以 / 开头）在当前窗口导航
 */
function linkifyText(text: string): string {
  let result = text
  
  // 1. 处理 {link=url}文字{/link} 格式（带自定义文字）
  const linkWithTextRegex = /{link=((?:https?:\/\/|\/)[^}]+)}([^{]*?){\/link}/g
  result = result.replace(linkWithTextRegex, (_match, url, linkText) => {
    const displayText = linkText.trim() || url
    const isExternal = url.startsWith('http')
    
    if (isExternal) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${displayText}</a>`
    }
    return `<a href="${url}">${displayText}</a>`
  })
  
  // 2. 处理 {link=url} 格式（不带自定义文字）
  const linkRegex = /{link=((?:https?:\/\/|\/)[^}]+)}/g
  result = result.replace(linkRegex, (_match, url) => {
    const isExternal = url.startsWith('http')
    
    if (isExternal) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    }
    return `<a href="${url}">${url}</a>`
  })
  
  return result
}

/**
 * 通知内容组件属性
 */
interface NotificationContentProps {
  /** 是否显示返回按钮 */
  showBackButton?: boolean
  /** 返回按钮点击回调 */
  onBack?: () => void
  /** 是否显示头部标题 */
  showHeader?: boolean
  /** 自定义容器类名 */
  containerClassName?: string
  /** 自定义内容高度 */
  contentHeight?: string
}

/**
 * 对外暴露的实例方法
 */
export interface NotificationContentHandle {
  /** 返回到通知列表视图 */
  backToList: () => void
  /** 当前是否处于详情视图 */
  isInDetail: () => boolean
}

/**
 * 通知内容组件
 * 提供消息列表和消息详情查看功能，可复用于不同场景
 */
export const NotificationContent = forwardRef<NotificationContentHandle, NotificationContentProps>(function NotificationContent({
  showBackButton = false,
  onBack,
  showHeader = true,
  containerClassName,
  contentHeight
}: NotificationContentProps, ref) {
  const navigate = useNavigate()
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null)
  const [_unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const COUNT = 20
  
  // 获取用户登录状态
  const user = useAuthStore((state) => state.auth.user)
  const isLoggedIn = !!user

  // 获取消息列表（首次加载）
  const fetchMessagesData = useCallback(async () => {
    // 未登录时不执行任何操作
    if (!isLoggedIn) return
    
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
  }, [isLoggedIn])

  // 加载更多消息（使用游标分页）
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !isLoggedIn) return

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
  }, [loadingMore, hasMore, isLoggedIn, messages])

  // 标记消息为已读
  const markAsRead = async (messageId: number) => {
    // 未登录时不执行任何操作
    if (!isLoggedIn) return
    
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
    onBack?.()
  }

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    backToList: () => {
      setSelectedMessage(null)
    },
    isInDetail: () => selectedMessage !== null,
  }), [selectedMessage])

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
    // 只有在用户登录时才订阅 IM 的未读数变化
    if (!isLoggedIn) {
      setUnreadCount(0)
      return
    }
    
    // 订阅 IM 的未读数变化（会自动获取一次）
    const unsubscribe = imManager.onUnreadCountChange((count) => {
      setUnreadCount(count)
    })
    return unsubscribe
  }, [isLoggedIn])

  // 组件挂载时获取消息列表
  useEffect(() => {
    if (isLoggedIn) {
      fetchMessagesData()
    }
  }, [isLoggedIn, fetchMessagesData])

  // 消息内容区域组件
  const MessageContent = () => (
    <div
      className={cn(
        'overflow-y-auto',
        contentHeight || (isMobile ? 'h-[calc(100vh-64px)]' : 'h-[400px]')
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
          contentHeight || (isMobile ? 'h-[calc(100vh-64px)]' : 'h-[400px]')
        )}>
          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          加载中...
        </div>
      ) : selectedMessage ? (
        // 消息详情视图
        <div className='p-4 space-y-4'>
          <div>
            <h4 className='font-semibold text-base mb-2'>{selectedMessage.title || '-'}</h4>
            {selectedMessage.created_at && (
              <p className='text-xs text-muted-foreground mb-4'>
                {new Date(selectedMessage.created_at).toLocaleString('zh-CN')}
              </p>
            )}
          </div>
          <Separator />
          <div
            ref={contentRef}
            className='text-sm text-foreground leading-relaxed prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-2 [&_a]:cursor-pointer [&_a]:font-medium [&_a]:transition-colors hover:[&_a]:text-primary/80 hover:[&_a]:decoration-primary/80'
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(linkifyText(selectedMessage.text)),
            }}
          />
        </div>
      ) : (
        // 消息列表视图
        <div className='pb-2'>
          {messages.length === 0 ? (
            <div className={cn(
              'flex items-center justify-center text-sm text-muted-foreground',
              contentHeight || (isMobile ? 'h-[calc(100vh-64px)]' : 'h-[400px]')
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
                          <h4 className='font-medium text-sm truncate'>{message.title || '-'}</h4>
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

  return (
    <div className={cn('flex flex-col', containerClassName)}>
      {/* 头部 */}
      {showHeader && (
        <>
          {selectedMessage ? (
            <div className='relative flex items-center justify-center px-4 py-3 border-b'>
              {showBackButton && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleBack}
                  className='absolute left-4 h-8 w-8 p-0'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
              )}
              <h3 className='font-semibold text-sm'>消息详情</h3>
            </div>
          ) : (
            <div className='flex items-center justify-center px-4 py-3 border-b'>
              <h3 className='font-semibold text-sm'>通知中心</h3>
            </div>
          )}
        </>
      )}

      <MessageContent />
    </div>
  )
})

/**
 * 获取未读消息数的 Hook
 */
export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const user = useAuthStore((state) => state.auth.user)
  const isLoggedIn = !!user

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0)
      return
    }
    
    const unsubscribe = imManager.onUnreadCountChange((count) => {
      setUnreadCount(count)
    })
    return unsubscribe
  }, [isLoggedIn])

  return unreadCount
}
