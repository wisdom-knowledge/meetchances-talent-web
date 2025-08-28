import { createFileRoute } from '@tanstack/react-router'
import InterviewPreparePage from '@/features/interview/prepare'

function PrepareRouteComponent() {
  const search = Route.useSearch() as { data?: string }

  const parseDataString = (data?: string): {
    jobId?: string | number
    inviteToken?: string
    isSkipConfirm?: boolean
  } => {
    // and为拼接关键词
    if (!data || typeof data !== 'string') return {}
    const result: { jobId?: string | number; inviteToken?: string; isSkipConfirm?: boolean } = {}
    const parts = data.split('and').filter(Boolean)
    for (const part of parts) {
      if (part.startsWith('job_id')) {
        const val = part.slice('job_id'.length)
        const num = Number(val)
        result.jobId = !Number.isNaN(num) && val.trim() !== '' ? num : val
      } else if (part.startsWith('invite_token')) {
        const val = part.slice('invite_token'.length)
        result.inviteToken = val
      } else if (part.startsWith('isSkipConfirm')) {
        const raw = part.slice('isSkipConfirm'.length).trim().toLowerCase()
        if (raw === '' || raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') {
          result.isSkipConfirm = false
        } else if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') {
          result.isSkipConfirm = true
        } else {
          // 其它任意非空值（例如 333）默认视为 true
          result.isSkipConfirm = true
        }
      }
    }
    return result
  }

  const { jobId, inviteToken, isSkipConfirm } = parseDataString(search?.data)

  return (
    <InterviewPreparePage
      jobId={jobId}
      inviteToken={inviteToken}
      isSkipConfirm={isSkipConfirm}
    />
  )
}

export const Route = createFileRoute('/_authenticated/interview/prepare')({
  component: PrepareRouteComponent,
  staticData: { hideSidebar: true },
})
