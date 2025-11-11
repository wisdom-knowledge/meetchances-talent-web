import { createFileRoute } from '@tanstack/react-router'
import ReferralPage from '@/features/referral'

export const Route = createFileRoute('/_authenticated/referral')({
  component: ReferralPage,
})

