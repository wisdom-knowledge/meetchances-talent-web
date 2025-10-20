import React from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { NotificationContent, NotificationContentHandle } from '@/components/notification-content'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export default function NotificationPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const contentRef = React.useRef<NotificationContentHandle>(null)
  
  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <div className='flex items-center gap-3'>
            {isMobile && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  const inDetail = contentRef.current?.isInDetail?.() ?? false
                  if (inDetail) {
                    contentRef.current?.backToList?.()
                    return
                  }
                  navigate({ to: '/mine' })
                }}
                className='h-8 w-8 p-0'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            )}
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>通知中心</h1>
          </div>
          <p className='text-muted-foreground'>查看您的所有通知消息</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 通知内容 */}
        <div className='space-y-6'>
          <NotificationContent
            ref={contentRef}
            showBackButton={false}
            showHeader={false}
            containerClassName='md:border md:rounded-lg'
            contentHeight='h-[calc(100vh-200px)]'
          />
        </div>
      </Main>
    </>
  )
}
