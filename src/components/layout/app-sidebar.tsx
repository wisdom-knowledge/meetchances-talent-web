import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/stores/authStore'
import { useMemo } from 'react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const authUser = useAuthStore((s) => s.auth.user)
  const userForSidebar = useMemo(() => {
    const name = authUser?.full_name || authUser?.accountNo || (authUser?.email ? authUser.email.split('@')[0] : '')
    const email = authUser?.email || ''
    const avatar = authUser?.avatar_url || '/avatars/shadcn.jpg'
    return { name, email, avatar }
  }, [authUser])
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarContent>
        {/* 品牌区域：横向铺满的新 Logo 与副标题 */}
        <div className='px-4 pt-4'>
          <img
            src={'https://dnu-cdn.xpertiise.com/design-assets/logo-and-text-no-padding.svg'}
            alt='一面千识 Logo'
            className='w-[100px] h-auto object-contain'
          />
          <div className='mt-1.5 px-0.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden'>
            一次面试，千种机会
          </div>
        </div>

        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userForSidebar} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
