import { createFileRoute } from '@tanstack/react-router'
import InvitedViewPage from '@/features/invited'

export const Route = createFileRoute('/_authenticated/invited/')({
  component: InvitedViewPage,
  staticData: { hideSidebar: true },
})


