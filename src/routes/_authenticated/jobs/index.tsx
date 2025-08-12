import { createFileRoute } from '@tanstack/react-router'
import JobsListPage from '@/features/jobs'

export const Route = createFileRoute('/_authenticated/jobs/')({
  component: JobsListPage,
})


