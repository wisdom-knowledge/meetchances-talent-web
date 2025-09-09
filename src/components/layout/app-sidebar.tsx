import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import logoCircle from '@/assets/images/logo-circle.svg'
import { useAuthStore } from '@/stores/authStore'
import { useMemo } from 'react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const authUser = useAuthStore((s) => s.auth.user)
  const userForSidebar = useMemo(() => {
    const name = authUser?.full_name || authUser?.accountNo || (authUser?.email ? authUser.email.split('@')[0] : '用户')
    const email = authUser?.email || ''
    const avatar = authUser?.avatar_url || '/avatars/shadcn.jpg'
    return { name, email, avatar }
  }, [authUser])
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarContent>
        {/* 静态展示默认团队，无下拉、无点击 */}
        <div className='flex items-center gap-2 px-2 py-2'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-full'>
            <img src={logoCircle} alt='logo' className='size-6' />
          </div>
          <div className='grid text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>一面千识</span>
            <span className='truncate text-xs'>一次面试,千种机会</span>
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
