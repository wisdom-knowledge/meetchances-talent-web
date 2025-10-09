import { useMemo } from 'react'
import { ChevronsUpDown, LogOut, User as UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()

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

  const handleProfile = () => {
    window.open('https://meetchances-talent.authing.cn/u?app_id=68a80c45ea682857b1f54cdc', '_blank', 'noopener,noreferrer')
  }

  const isLogin = useMemo(() => !!user?.name, [user?.name])
  
  // PC端窄版布局
  if (!isMobile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='flex flex-col items-center justify-center gap-1 py-3 px-2 w-full rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                onClick={() => {
                  if (!isLogin) handleLogin()
                }}
              >
                <Avatar className='h-8 w-8 rounded-full'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-full'>
                    {user.name.charAt(0) || <UserIcon className='h-4 w-4' />}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            {isLogin && (
              <DropdownMenuContent
                className='min-w-56 rounded-lg'
                side='right'
                align='end'
                sideOffset={8}
              >
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm leading-none font-medium'>
                      {user.name}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfile}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-user-round-icon lucide-user-round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                  账号信息
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAbout}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-building2-icon lucide-building-2"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>
                  关于我们
                </DropdownMenuItem>
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

  // 移动端：保持原有样式
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
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm leading-none font-medium'>
                    {user.name}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-user-round-icon lucide-user-round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                账号信息
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAbout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-building2-icon lucide-building-2"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>
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
