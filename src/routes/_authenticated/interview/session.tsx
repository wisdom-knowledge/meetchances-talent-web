import { createFileRoute, redirect } from '@tanstack/react-router'
import InterviewPage from '@/features/interview'
import { MobileFullscreenMask } from '@/components/mobile-fullscreen-mask'
import { useIsMobile } from '@/hooks/use-mobile'

export const Route = createFileRoute('/_authenticated/interview/session')({
  validateSearch: (search: Record<string, unknown>) => {
    const interviewId = search?.interview_id
    const jobId = search?.job_id
    const jobApplyId = search?.job_apply_id
    const isMock = search?.is_mock
    const interviewNodeId = search?.interview_node_id
    if (interviewId === undefined || interviewId === null || interviewId === '') {
      throw redirect({ to: '/interview/prepare' })
    }
    return {
      interview_id: interviewId as string | number,
      job_id: (jobId as string | number | undefined),
      job_apply_id: jobApplyId as string | number | undefined,
      is_mock: isMock as boolean | undefined,
      interview_node_id: interviewNodeId as string | number | undefined,
    }
  },
  component: InterviewSessionRouteComponent,
  staticData: { hideSidebar: true, interviewBg: true },
})

function InterviewSessionRouteComponent() {
  const isMobile = useIsMobile()
  const search = Route.useSearch() as { interview_id: string | number; job_id?: string | number; job_apply_id?: string | number; interview_node_id?: string | number; is_mock?: boolean }
  
  if (isMobile) {
    return <MobileFullscreenMask open={true} />
  }

  return <InterviewPage interviewId={search.interview_id} jobId={search.job_id} isMock={search.is_mock} jobApplyId={search.job_apply_id} interviewNodeId={search.interview_node_id} />
}


