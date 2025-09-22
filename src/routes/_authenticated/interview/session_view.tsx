import { createFileRoute } from '@tanstack/react-router'
import InterviewSessionViewPage from '@/features/interview/session-view-page'

export const Route = createFileRoute('/_authenticated/interview/session_view')({
  component: InterviewSessionViewPage,
  staticData: { hideSidebar: true, interviewBg: true },
})


