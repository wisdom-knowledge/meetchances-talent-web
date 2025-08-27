import { createFileRoute } from '@tanstack/react-router'
import HomeViewPage from '@/features/home'

export const Route = createFileRoute('/_authenticated/home/')({
  component: HomeViewPage,
  staticData: { hideSidebar: false },
})


