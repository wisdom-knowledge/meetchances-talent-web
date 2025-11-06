import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'
import { shouldHideBottomTab } from '@/components/layout/data/bottom-tab-config'

// 以 URL 方式引用构建后资源，避免类型问题（使用相对路径确保 Vite 解析）
const ICONS = {
  home: new URL('../assets/images/icons/home.svg', import.meta.url).href,
  homeActive: new URL('../assets/images/icons/home-active.svg', import.meta.url).href,
  jobs: new URL('../assets/images/icons/jobs.svg', import.meta.url).href,
  jobsActive: new URL('../assets/images/icons/jobs-active.svg', import.meta.url).href,
  mock: new URL('../assets/images/icons/mock-intervew.svg', import.meta.url).href,
  mockActive: new URL('../assets/images/icons/mock-interview-active.svg', import.meta.url).href,
  mine: new URL('../assets/images/icons/mine.svg', import.meta.url).href,
  mineActive: new URL('../assets/images/icons/mine-active.svg', import.meta.url).href,
}

interface TabItem {
  label: string
  to: string
  icon: string
  iconActive: string
  isActive: (pathname: string) => boolean
}

const TABS: TabItem[] = [
  { label: '主页', to: '/home', icon: ICONS.home, iconActive: ICONS.homeActive, isActive: (p) => p.startsWith('/home') },
  { label: '职位', to: '/jobs', icon: ICONS.jobs, iconActive: ICONS.jobsActive, isActive: (p) => p.startsWith('/jobs') },
  { label: '模拟面试', to: '/mock-interview', icon: ICONS.mock, iconActive: ICONS.mockActive, isActive: (p) => p.startsWith('/mock-interview') },
  { label: '我的', to: '/mine', icon: ICONS.mine, iconActive: ICONS.mineActive, isActive: (p) => p.startsWith('/mine') },
]

export function MobileBottomTab() {
  const env = useRuntimeEnv()
  const { pathname } = useLocation()

  if (env === 'desktop') return null
  if (shouldHideBottomTab(pathname)) return null

  // 小程序端隐藏“主页 / 职位”两个 Tab
  const tabs = env === 'wechat-miniprogram' ? TABS.filter((t) => t.to !== '/home' && t.to !== '/jobs') : TABS
  const gridColsClass = tabs.length === 2 ? 'grid-cols-2' : tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'pb-safe'
      )}
      aria-label='Bottom Navigation'
    >
      <ul className={cn('mx-auto grid max-w-md items-center gap-1 px-2 py-2', gridColsClass)}>
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)
          return (
            <li key={tab.to} className='flex items-center justify-center'>
              <Link
                to={tab.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                  active ? 'text-[var(--color-blue-600)]' : 'text-muted-foreground'
                )}
              >
                <img
                  src={active ? tab.iconActive : tab.icon}
                  alt={tab.label}
                  className='h-6 w-6'
                />
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default MobileBottomTab


