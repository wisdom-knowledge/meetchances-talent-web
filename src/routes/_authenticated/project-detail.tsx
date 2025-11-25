import { createFileRoute } from '@tanstack/react-router'
import ProjectDetailPage from '@/features/project-detail'

export const Route = createFileRoute('/_authenticated/project-detail')({
  component: ProjectDetailPage,
  staticData: {
    hideSidebar: true,
  },
})

