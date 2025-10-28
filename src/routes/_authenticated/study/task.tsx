import { createFileRoute } from '@tanstack/react-router'
import StudyTaskPage from '@/features/study/task'

export const Route = createFileRoute('/_authenticated/study/task')({
  component: StudyTaskPage,
})

