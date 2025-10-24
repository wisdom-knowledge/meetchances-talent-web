import React from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import TitleBar from '@/components/title-bar'
import { NotificationContent, NotificationContentHandle } from '@/components/notification-content'
import { useNavigate } from '@tanstack/react-router'

export default function NotificationPage() {
  const navigate = useNavigate()
  const contentRef = React.useRef<NotificationContentHandle>(null)
  
  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='md:mx-16 py-0'>
        <TitleBar
          title='通知中心'
          back
          subtitle='查看您的所有通知消息'
          separator
          onBack={() => {
            const inDetail = contentRef.current?.isInDetail?.() ?? false
            if (inDetail) {
              contentRef.current?.backToList?.()
              return
            }
            navigate({ to: '/mine' })
          }}
        />

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
