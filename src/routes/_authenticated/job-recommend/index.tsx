import JobRecommendPage from '@/features/job-recommend'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/job-recommend/')({
  component: JobRecommendPage,
})


