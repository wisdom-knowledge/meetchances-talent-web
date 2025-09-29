import { createFileRoute } from '@tanstack/react-router'
import JobsDetailPage from '@/features/jobs/detail-page.tsx'

export const Route = createFileRoute('/jobs/$job_id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { job_id } = Route.useParams()
  return <JobsDetailPage jobId={job_id} />
}

