import JobsListContent from '@/features/jobs/components/jobs-list-content'
import { JobsSortBy, JobsSortOrder } from '@/features/jobs/api'

interface ReferrableJobsTabProps {
  isActive: boolean
}

export default function ReferrableJobsTab({ isActive }: ReferrableJobsTabProps) {
  // TabsContent 默认不会卸载，为了避免后台请求，在非激活状态不渲染
  if (!isActive) return null

  return (
    <JobsListContent
      referralOnly
      enableUrlSync={false}
      heightMode='fill'
      showSortControls={false}
      defaultSortBy={JobsSortBy.ReferralBonus}
      defaultSortOrder={JobsSortOrder.Desc}
      title='职位列表'
      description='可推荐岗位（具备内推简历）'
    />
  )
}


