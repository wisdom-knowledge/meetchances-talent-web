import Cookies from 'js-cookie'
import { useEffect } from 'react'
import { Outlet, useMatches, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchTalentMe } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import SkipToMain from '@/components/skip-to-main'
import { includes } from 'lodash'

interface Props {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false'
  const setUser = useAuthStore((s) => s.auth.setUser)
  const matches = useMatches()
  const hideSidebar = matches.some((m) => (m.staticData as { hideSidebar?: boolean } | undefined)?.hideSidebar)
  const { location } = useRouterState()

  // 不调用talentme接口的路由列表
  const noTalentMeRoutes = ['/job-detail']

  const { data, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchTalentMe,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    select: (d) => d,
    enabled: !includes(noTalentMeRoutes, location.pathname),
  })

  useEffect(() => {
    if (!data) return
    setUser({
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      is_active: data.is_active,
      is_superuser: data.is_superuser,
      is_onboard: data.is_onboard,
      accountNo: data.full_name || data.email.split('@')[0],
    })
  }, [data, setUser])

  useEffect(() => {
    if (!error) return
    setUser(null)
  }, [error, setUser])
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
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          {children ? children : <Outlet />}
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
