import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { IconId, IconWallet, IconLogout2, IconPhone, IconPencil } from '@tabler/icons-react'

export default function MinePage() {
  const user = useAuthStore((s) => s.auth.user)

  return (
    <>
      {/* Header 已在 mobile 环境隐藏，这里保持一致 */}
      <Header fixed>
        <div className='ml-auto' />
      </Header>

      <Main fixed>
        {/* 顶部 头像（圆形） + 姓名 + 电话，垂直布局 */}
        <div className='flex flex-col items-center py-6 mb-2'>
          <button type='button' onClick={gotoAccountInfo} className='relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 transition-transform'>
            <Avatar className='h-24 w-24 rounded-full'>
              <AvatarImage src={(user as unknown as { avatar_url?: string })?.avatar_url || ''} alt={user?.full_name || ''} />
              <AvatarFallback className='rounded-full'>
                {(user?.full_name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className='absolute -right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C994F7] p-1 aspect-square'>
              <IconPencil className='h-3.5 w-3.5 text-white' />
            </div>
          </button>
          <h1 className='mt-3 text-2xl font-bold tracking-tight md:text-3xl'>
            {user?.full_name  || '未登录'}
          </h1>
          {user?.phone_number ? (
            <div className='mt-2 flex items-center text-base'>
              <IconPhone className='mr-2 h-5 w-5' />
              <span>{user.phone_number}</span>
            </div>
          ) : null}
        </div>
        {/* 菜单 */}
        <div className='space-y-2'>
          <MenuItem to='/resume' icon={<IconId />} label='我的简历' />
          <MenuItem to='/wallet' icon={<IconWallet />} label='钱包' />
          <MenuAction onClick={gotoAccountInfo} icon={<UserIcon />} label='账号信息' />
          <MenuAction onClick={() => window.open('http://meetchances.com/', '_blank', 'noopener,noreferrer')} icon={<BuildingIcon />} label='关于我们' />
          <MenuAction onClick={handleLogout} icon={<IconLogout2  />} label='退出登录' />
        </div>
      </Main>
    </>
  )
}

function MenuItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className='flex items-center justify-between rounded-lg px-2 py-3 hover:bg-accent active:bg-accent/80 transition-[transform,background-color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation'
    >
      <div className='flex items-center gap-3'>
        {icon}
        <span className='text-base'>{label}</span>
      </div>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='m9 18 6-6-6-6' /></svg>
    </Link>
  )
}

function MenuAction({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className='w-full flex items-center justify-between rounded-lg px-2 py-3 hover:bg-accent active:bg-accent/80 transition-[transform,background-color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation'
    >
      <div className='flex items-center gap-3'>
        {icon}
        <span className='text-base'>{label}</span>
      </div>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='m9 18 6-6-6-6' /></svg>
    </button>
  )
}

function handleLogout() {
  const baseLogoutUrl = import.meta.env.VITE_AUTH_LOGOUT_URL as string | undefined
  if (baseLogoutUrl) {
    location.replace(baseLogoutUrl)
  }
}

function gotoAccountInfo() {
  window.open('https://meetchances-talent.authing.cn/u?app_id=68a80c45ea682857b1f54cdc', '_blank', 'noopener,noreferrer')
}

// 复用 @nav-user.tsx 中的两个图标（用原生 SVG，避免额外依赖）
function UserIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='lucide lucide-user-round-icon lucide-user-round'><circle cx='12' cy='8' r='5'/><path d='M20 21a8 8 0 0 0-16 0'/></svg>
  )
}

function BuildingIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='lucide lucide-building2-icon lucide-building-2'><path d='M10 12h4'/><path d='M10 8h4'/><path d='M14 21v-3a2 2 0 0 0-4 0v3'/><path d='M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2'/><path d='M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16'/></svg>
  )
}


