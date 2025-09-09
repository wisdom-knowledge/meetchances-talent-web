import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/' || location.pathname === '') {
      throw redirect({ to: '/home' })
    }
  },
})
