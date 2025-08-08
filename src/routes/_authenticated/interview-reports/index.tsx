import { createFileRoute } from '@tanstack/react-router'
import InterviewReports from '@/features/interview-reports'

export const Route = createFileRoute('/_authenticated/interview-reports/')({
  component: InterviewReports,
})
