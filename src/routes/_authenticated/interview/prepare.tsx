import { createFileRoute } from '@tanstack/react-router'
import InterviewPreparePage from '@/features/interview/prepare'

export const Route = createFileRoute('/_authenticated/interview/prepare')({
  component: () => {
    const search = Route.useSearch() as {
      job_id?: string | number
      invite_token?: string
      isSkipConfirm?: boolean
    }
    return (
      <InterviewPreparePage
        jobId={search?.job_id}
        inviteToken={search?.invite_token}
        isSkipConfirm={search?.isSkipConfirm}
      />
    )
  },
  staticData: { hideSidebar: true },
})
