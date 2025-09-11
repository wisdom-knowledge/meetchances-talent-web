import { useMemo } from 'react'
import { ChevronsUpDown, LogOut, User as UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import aboutUsSvg from '@/assets/images/about_us.svg'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { state } = useSidebar()

  const handleLogout = () => {
    const baseLogoutUrl = import.meta.env.VITE_AUTH_LOGOUT_URL
    location.replace(baseLogoutUrl)
  }

  const handleLogin = () => {
    const baseLoginUrl = import.meta.env.VITE_AUTH_LOGIN_URL
    if (baseLoginUrl) location.replace(baseLoginUrl)
  }

  const handleAbout = () => {
    window.open('http://meetchances.com/', '_blank', 'noopener,noreferrer')
  }

  const isLogin = useMemo(() => !!user?.name, [user?.name])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              onClick={() => {
                if (!isLogin) handleLogin()
              }}
            >
              <Avatar className='h-8 w-8 rounded-[8px]'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='rounded-[8px]'>
                  {user.name.charAt(0) || <UserIcon className='h-4 w-4' />}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {user.name || '未登录'}
                </span>
                {/* <span className='truncate text-xs'>{user.email}</span> */}
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {isLogin && (
            <DropdownMenuContent
              className={`w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg`}
              side='top'
              align={state === 'collapsed' ? 'start' : 'center'}
              sideOffset={4}
            >
              <DropdownMenuItem onClick={handleAbout}>
                <img src={aboutUsSvg} alt='' className='h-4 w-4' />
                关于我们
              </DropdownMenuItem>
              {/* <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to='/settings/account'>
                    <BadgeCheck />
                    账号
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/settings'>
                    <CreditCard />
                    账单
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/settings/notifications'>
                    <Bell />
                    通知
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
