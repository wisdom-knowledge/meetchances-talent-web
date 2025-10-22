import type { AnyRouter } from '@tanstack/react-router'

let appRouter: AnyRouter | null = null

export function setRouterInstance(router: AnyRouter) {
  appRouter = router
}

export function getRouterInstance(): AnyRouter | null {
  return appRouter
}


