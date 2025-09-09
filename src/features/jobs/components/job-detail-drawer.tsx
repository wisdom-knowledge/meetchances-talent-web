import type { ApiJob } from '@/features/jobs/api'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import JobDetailContent from '@/features/jobs/components/job-detail-content'

export interface JobDetailDrawerProps {
  open: boolean
  job: ApiJob | null
  onOpenChange: (open: boolean) => void
  onBack: () => void
  recommendName?: string
}

export default function JobDetailDrawer({
  open,
  job,
  onOpenChange,
  onBack,
  recommendName = '',
}: JobDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex min-h-0 w-full flex-col overflow-y-auto px-4 sm:max-w-none md:w-[85vw] md:px-5 lg:w-[60vw] xl:w-[50vw] [&>button]:hidden'>
        <SheetTitle className='sr-only'>职位详情</SheetTitle>
        {job && (
          <JobDetailContent
            job={job}
            onBack={onBack}
            recommendName={recommendName}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
