import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import AppLogo from '@/assets/app-logo'
import { useAuthStore } from '@/stores/authStore'
import { useMemo } from 'react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const authUser = useAuthStore((s) => s.auth.user)
  const userForSidebar = useMemo(() => {
    const name = authUser?.full_name || authUser?.accountNo || (authUser?.email ? authUser.email.split('@')[0] : '用户')
    const email = authUser?.email || ''
    const avatar = '/avatars/shadcn.jpg'
    return { name, email, avatar }
  }, [authUser])
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarContent>
        {/* 静态展示默认团队，无下拉、无点击 */}
        <div className='flex items-center gap-2 px-2 py-2'>
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
            <AppLogo className='size-4 text-white' />
          </div>
          <div className='grid text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>Meetchances Partner</span>
            <span className='truncate text-xs'>发布职位、管理候选人</span>
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
