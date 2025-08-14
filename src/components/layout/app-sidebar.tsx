import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import AppLogo from '@/assets/app-logo'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarContent>
        {/* 静态展示默认团队，无下拉、无点击 */}
        <div className='flex items-center gap-2 px-2 py-2'>
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
            <AppLogo className='size-4 text-white' />
          </div>
          <div className='grid text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>Meetchances Talent</span>
            <span className='truncate text-xs'>interview & apply job</span>
          </div>
        </div>

        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
