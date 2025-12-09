import { createFileRoute } from '@tanstack/react-router'
import ProjectPage from '@/features/project'

export const Route = createFileRoute('/_authenticated/project')({
  component: ProjectPage,
  staticData: {
    hideSidebar: true,
  },
})

