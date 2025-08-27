import { createFileRoute } from '@tanstack/react-router'
import FinishViewPage from '@/features/finish'

export const Route = createFileRoute('/_authenticated/finish/')({
  component: FinishViewPage,
  staticData: { hideSidebar: true },
})


