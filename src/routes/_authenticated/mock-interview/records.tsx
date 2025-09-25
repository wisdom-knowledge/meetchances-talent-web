import { createFileRoute } from '@tanstack/react-router'
import MockInterviewRecordsPage from '@/features/mock-interview/records'

export const Route = createFileRoute('/_authenticated/mock-interview/records')({
  component: () => <MockInterviewRecordsPage />,
})

