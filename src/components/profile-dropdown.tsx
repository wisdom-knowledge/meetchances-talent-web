import { User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ProfileDropdown() {
  const user = useAuthStore((s) => s.auth.user)
  const handleLogout = () => {
    const baseLogoutUrl = import.meta.env.VITE_AUTH_LOGOUT_URL
    location.replace(baseLogoutUrl)
  }

  const handleLogin = () => {
    const baseLoginUrl = import.meta.env.VITE_AUTH_LOGIN_URL
    if (baseLoginUrl) location.replace(baseLoginUrl)
  }

  const isLogin = Boolean(user)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='relative h-8 w-8 rounded-full'
          onClick={() => {
            if (!isLogin) handleLogin()
          }}
        >
          <Avatar className='h-8 w-8'>
            <AvatarImage
              src={user?.avatar_url || '/avatars/01.png'}
              alt={user?.full_name ?? user?.email ?? 'user'}
            />
            <AvatarFallback>
              {user && (user.full_name || user.email) ? (
                (user.full_name || user.email)!.slice(0, 1)
              ) : (
                <UserIcon className='h-4 w-4' />
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      {isLogin && (
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {user?.full_name ||
                  user?.accountNo ||
                  (user?.email ? user.email.split('@')[0] : '未登录')}
              </p>
              {/* <p className='text-muted-foreground text-xs leading-none'>
                {user?.email ?? ''}
              </p> */}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                个人资料
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                账单
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                设置
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>新建团队</DropdownMenuItem>
          </DropdownMenuGroup> */}
          {/* <DropdownMenuSeparator /> */}
          {user && (
            <DropdownMenuItem onClick={handleLogout}>
              退出登录
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
