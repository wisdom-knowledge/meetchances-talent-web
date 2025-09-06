import { createFileRoute, redirect } from '@tanstack/react-router'
import InterviewPage from '@/features/interview'
import { MobileFullscreenMask } from '@/components/mobile-fullscreen-mask'
import { useIsMobile } from '@/hooks/use-mobile'

export const Route = createFileRoute('/_authenticated/interview/session')({
  validateSearch: (search: Record<string, unknown>) => {
    const jobId = search?.job_id
    const jobApplyId = search?.job_apply_id
    const interviewNodeId = search?.interview_node_id
    if (jobId === undefined || jobId === null || jobId === '') {
      throw redirect({ to: '/interview/prepare' })
    }
    return {
      job_id: jobId as string | number,
      job_apply_id: jobApplyId as string | number | undefined,
      interview_node_id: interviewNodeId as string | number | undefined,
    }
  },
  component: InterviewSessionRouteComponent,
  staticData: { hideSidebar: true },
})

function InterviewSessionRouteComponent() {
  const isMobile = useIsMobile()
  const search = Route.useSearch() as { job_id: string | number; job_apply_id?: string | number; interview_node_id?: string | number }
  
  if (isMobile) {
    return <MobileFullscreenMask open={true} />
  }

  return <InterviewPage jobId={search.job_id} jobApplyId={search.job_apply_id} interviewNodeId={search.interview_node_id} />
}


