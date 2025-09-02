import { createFileRoute } from '@tanstack/react-router'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileFullscreenMask } from '@/components/mobile-fullscreen-mask'
import InterviewPreparePage from '@/features/interview/prepare'

const parseDataString = (
  data?: string
): {
  jobId?: string | number
  inviteToken?: string
  isSkipConfirm?: boolean
} => {
  // and为拼接关键词
  if (!data || typeof data !== 'string') return {}
  const result: {
    jobId?: string | number
    inviteToken?: string
    isSkipConfirm?: boolean
  } = {}
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
      if (
        raw === '' ||
        raw === '0' ||
        raw === 'false' ||
        raw === 'no' ||
        raw === 'off'
      ) {
        result.isSkipConfirm = false
      } else if (
        raw === '1' ||
        raw === 'true' ||
        raw === 'yes' ||
        raw === 'on'
      ) {
        result.isSkipConfirm = true
      } else {
        // 其它任意非空值（例如 333）默认视为 true
        result.isSkipConfirm = true
      }
    }
  }
  return result
}

function PrepareRouteComponent() {
  const isMobile = useIsMobile()
  const search = Route.useSearch() as {
    data?: string
    job_id?: string | number
    invite_token?: string
    isSkipConfirm?: boolean
  }

  if (isMobile) {
    return <MobileFullscreenMask open={true} />
  }

  if (search?.data) {
    const { jobId, inviteToken, isSkipConfirm } = parseDataString(search?.data)
    return (
      <InterviewPreparePage
        jobId={jobId}
        inviteToken={inviteToken}
        isSkipConfirm={isSkipConfirm}
      />
    )
  }

  return (
    <InterviewPreparePage
      jobId={search?.job_id}
      inviteToken={search?.invite_token}
      isSkipConfirm={search?.isSkipConfirm}
    />
  )
}

export const Route = createFileRoute('/_authenticated/interview/prepare')({
  component: PrepareRouteComponent,
  staticData: { hideSidebar: true },
})
