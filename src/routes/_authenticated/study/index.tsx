import { createFileRoute } from '@tanstack/react-router'
import StudyPage from '@/features/study'

export const Route = createFileRoute('/_authenticated/study/')({
  component: StudyPage,
})


