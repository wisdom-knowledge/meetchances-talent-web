import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { AiInterviewSection } from './components/interview-record'
import { CandidateInfoCard } from './components/user-basic-info'
import interviewReportData from './data/index'

export default function InterviewReports() {
  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='overflow-y-auto' fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            面试报告
          </h1>
          <p className='text-muted-foreground'>查看详细的面试分析和评估结果</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 页面主体内容 */}
        <div className='space-y-6'>
          <CandidateInfoCard data={interviewReportData.data} />
          <AiInterviewSection
            data={interviewReportData.data.ai_interview}
            videoUrl={interviewReportData.data.video_url}
          />
        </div>
      </Main>
    </>
  )
}
