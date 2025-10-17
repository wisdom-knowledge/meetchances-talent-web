import Cookies from 'js-cookie'
import { Outlet, useMatches } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import SkipToMain from '@/components/skip-to-main'
import { MobileBottomTab } from '@/components/mobile-bottom-tab'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'

interface Props {
  children?: React.ReactNode
}

export function PublicSidebarLayout({ children }: Props) {
  const env = useRuntimeEnv()
  const defaultOpen = Cookies.get('sidebar_state') !== 'false'
  const matches = useMatches()
  const hideSidebar = matches.some((m) => (m.staticData as { hideSidebar?: boolean } | undefined)?.hideSidebar)
  const interviewBg = matches.some((m) => (m.staticData as { interviewBg?: boolean } | undefined)?.interviewBg)

  return (
    <SearchProvider>
      <SidebarProvider 
        defaultOpen={defaultOpen}
      >
        <SkipToMain />
        {!hideSidebar && <AppSidebar />}
        <div
          id='content'
          style={{
            '--sidebar-width': '5rem',
          } as React.CSSProperties}
          className={cn(
            'ml-auto w-full max-w-full',
            !hideSidebar && 'md:w-[calc(100%-5rem)]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh',
            interviewBg && 'bg-[#F1E3FD]',
            env === 'mobile' && 'pb-safe'
          )}
        >
          {children ? children : <Outlet />}
          <MobileBottomTab />
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
