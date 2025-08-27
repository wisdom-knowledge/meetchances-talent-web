import { createFileRoute, redirect } from '@tanstack/react-router'
import InterviewPage from '@/features/interview'

export const Route = createFileRoute('/_authenticated/interview/session')({
  validateSearch: (search: Record<string, unknown>) => {
    const jobId = search?.job_id
    if (jobId === undefined || jobId === null || jobId === '') {
      throw redirect({ to: '/interview/prepare' })
    }
    return { job_id: jobId as string | number }
  },
  component: InterviewSessionRouteComponent,
  staticData: { hideSidebar: true },
})

function InterviewSessionRouteComponent() {
  const search = Route.useSearch() as { job_id: string | number }
  return <InterviewPage jobId={search.job_id} />
}


