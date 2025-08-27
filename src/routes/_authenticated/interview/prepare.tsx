import { createFileRoute } from '@tanstack/react-router'
import InterviewPreparePage from '@/features/interview/prepare'

export const Route = createFileRoute('/_authenticated/interview/prepare')({
  component: () => {
    const search = Route.useSearch() as { job_id?: string | number }
    return <InterviewPreparePage jobId={search?.job_id} />
  },
  staticData: { hideSidebar: true },
})


