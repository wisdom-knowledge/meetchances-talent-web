import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/stores/authStore'
import logoCircle from '@/assets/images/logo-circle.svg'
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
        {/* 展开态：横向 Logo + 文案 */}
        <div className='px-4 pt-4 group-data-[collapsible=icon]:hidden'>
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
          <div className='mx-auto flex aspect-square size-8 items-center justify-center rounded-full'>
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
      <SidebarRail />
    </Sidebar>
  )
}
