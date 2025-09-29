import { createFileRoute } from '@tanstack/react-router'
import { PublicSidebarLayout } from '@/components/layout/public-sidebar-layout'

export const Route = createFileRoute('/_public')({
  component: PublicSidebarLayout,
})