import { createFileRoute } from '@tanstack/react-router'
import MinePage from '@/features/mine'

export const Route = createFileRoute('/_authenticated/mine/')({
  component: MinePage,
  staticData: { hideSidebar: false },
})


