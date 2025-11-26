import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import ReferralPage from '@/features/referral'

// 定义 URL 参数验证 schema
const referralSearchSchema = z.object({
  invitedCode: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/referral')({
  component: ReferralPage,
  validateSearch: referralSearchSchema,
})

