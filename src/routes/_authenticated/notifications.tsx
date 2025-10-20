import { createFileRoute } from '@tanstack/react-router'
import NotificationPage from '@/features/notifications'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationPage,
})