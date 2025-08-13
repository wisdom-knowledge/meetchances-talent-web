import { createFileRoute } from '@tanstack/react-router'
import ResumePage from '@/features/resume'

export const Route = createFileRoute('/_authenticated/resume/')({
  component: ResumePage,
})


