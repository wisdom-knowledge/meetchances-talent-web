import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/stores/authStore'
import logoCircle from '@/assets/images/logo-circle.svg'
import { useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useNavigate } from '@tanstack/react-router'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.auth.user)
  const userForSidebar = useMemo(() => {
    const name = authUser?.full_name || authUser?.accountNo || (authUser?.email ? authUser.email.split('@')[0] : '')
    const email = authUser?.email || ''
    const avatar = authUser?.avatar_url || '/avatars/shadcn.jpg'
    return { name, email, avatar }
  }, [authUser])

  const handleLogoClick = () => {
    navigate({ to: '/home' })
  }
  
  // 移动端：保持原有的可折叠侧边栏样式
  if (isMobile) {
    return (
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarContent>
          {/* 展开态：横向 Logo + 文案 */}
          <div 
            className='px-4 pt-4 group-data-[collapsible=icon]:hidden cursor-pointer'
            onClick={handleLogoClick}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleLogoClick()
              }
            }}
          >
            <img
              src={'https://dnu-cdn.xpertiise.com/design-assets/logo-and-text-no-padding.svg'}
              alt='一面千识 Logo'
              className='w-[100px] h-auto object-contain'
            />
            <div className='mt-1.5 px-0.5 text-xs text-muted-foreground'>
              一次面试，千种机会
            </div>
          </div>

          {/* 收起态：仅小图标 */}
          <div className='hidden px-2 pt-3 group-data-[collapsible=icon]:block'>
            <div 
              className='mx-auto flex aspect-square size-8 items-center justify-center rounded-full cursor-pointer hover:bg-accent transition-colors'
              onClick={handleLogoClick}
              role='button'
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleLogoClick()
                }
              }}
            >
              <img src={logoCircle} alt='一面千识 Logo 小图标' className='size-6' />
            </div>
          </div>

          {sidebarData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userForSidebar} />
        </SidebarFooter>
      </Sidebar>
    )
  }
  
  // PC端：窄版侧边栏，图标垂直排列
  return (
    <Sidebar 
      collapsible='none' 
      variant='sidebar' 
      className='!w-20 border-r !h-svh !z-50'
      {...props}
    >
      <SidebarContent className='!flex-1 !min-h-0 flex flex-col gap-0 overflow-visible'>
        {/* Logo 区域 */}
        <div 
          className='flex items-center justify-center py-4 flex-shrink-0 cursor-pointer hover:bg-accent transition-colors'
          onClick={handleLogoClick}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleLogoClick()
            }
          }}
        >
          <img src={logoCircle} alt='一面千识 Logo' className='h-9 w-9' />
        </div>

        {/* 导航菜单 - 占据剩余空间 */}
        <div className='flex-1 overflow-auto -mt-2'>
          {sidebarData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </div>
      </SidebarContent>
      <SidebarFooter className='!mt-0 !p-2 flex-shrink-0'>
        <NavUser user={userForSidebar} />
      </SidebarFooter>
    </Sidebar>
  )
}
