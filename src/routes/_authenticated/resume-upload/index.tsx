import ResumeUploadPage from '@/features/resume-upload'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/resume-upload/')({
  component: ResumeUploadPage,
})

