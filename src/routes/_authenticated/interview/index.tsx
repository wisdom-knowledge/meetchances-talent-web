import { createFileRoute } from '@tanstack/react-router'
import InterviewPreparePage from '@/features/interview/prepare'

export const Route = createFileRoute('/_authenticated/interview/')({
  component: InterviewPreparePage,
  staticData: { hideSidebar: true },
})


