import Cookies from 'js-cookie'
import { Outlet, useMatches } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import SkipToMain from '@/components/skip-to-main'

interface Props {
  children?: React.ReactNode
}

export function PublicSidebarLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false'
  const matches = useMatches()
  const hideSidebar = matches.some((m) => (m.staticData as { hideSidebar?: boolean } | undefined)?.hideSidebar)
  const interviewBg = matches.some((m) => (m.staticData as { interviewBg?: boolean } | undefined)?.interviewBg)

  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        {!hideSidebar && <AppSidebar />}
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            !hideSidebar && 'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            !hideSidebar && 'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh',
            interviewBg && 'bg-[#F1E3FD]'
          )}
        >
          {children ? children : <Outlet />}
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
