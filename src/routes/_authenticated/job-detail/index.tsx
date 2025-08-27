import { createFileRoute } from '@tanstack/react-router'
import JobDetailViewPage from '@/features/job-detail'

export const Route = createFileRoute('/_authenticated/job-detail/')({
  component: JobDetailViewPage,
  staticData: { hideSidebar: true },
})


