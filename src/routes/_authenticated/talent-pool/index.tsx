import TalentPoolPage from '@/features/talent-pool'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/talent-pool/')({
  component: TalentPoolPage,
})


