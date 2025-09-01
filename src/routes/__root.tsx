import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useRouterStore } from '@/stores/routerStore'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'

function RootComponent() {
  const { location } = useRouterState()
  const setPath = useRouterStore((s) => s.setPath)

  useEffect(() => {
    setPath(location.href)
  }, [location.href, setPath])

  return (
    <>
      <NavigationProgress />
      <Outlet />
      <Toaster duration={5000} />
      {/* 开发调试工具：如需启用，请在开发环境下渲染下方组件 */}
      {/* {import.meta.env.MODE === 'development' && (
        <>
          <ReactQueryDevtools buttonPosition='bottom-left' />
          <TanStackRouterDevtools position='bottom-right' />
        </>
      )} */}
    </>
  )
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
