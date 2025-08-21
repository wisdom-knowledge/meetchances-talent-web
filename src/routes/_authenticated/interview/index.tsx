import { createFileRoute } from '@tanstack/react-router'
import InterviewPage from '@/features/interview'

export const Route = createFileRoute('/_authenticated/interview/')({
  component: InterviewPage,
  staticData: { hideSidebar: true },
})


