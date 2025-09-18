import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { AiInterviewSection } from './components/interview-record'
import { CandidateInfoCard } from './components/user-basic-info'
import { SharePoster } from './components/share-poster'
import interviewReportData from './data/index'

export default function InterviewReports() {
  const [showSharePoster, setShowSharePoster] = useState(false)

  // 从数据中提取需要的信息
  const candidateName = interviewReportData.data.applicant_brief?.replace(/的申请报告$/, '') || '候选人'
  const score = interviewReportData.data.overall_score?.score || 0
  
  // 计算面试时间
  const getInterviewDate = () => {
    const detailText = interviewReportData.data.ai_interview?.detail_text
    if (!detailText || detailText.length === 0) return '--'
    
    const firstTimestamp = detailText[0]?.metadata?.ts
    if (!firstTimestamp) return '--'
    
    try {
      const dateObj = new Date(firstTimestamp)
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\//g, '-')
    } catch (_e) {
      return '--'
    }
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='overflow-y-auto' fixed>
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              面试报告
            </h1>
            <p className='text-muted-foreground'>查看详细的面试分析和评估结果</p>
          </div>
          
          {/* 生成海报按钮 */}
          <Button 
            onClick={() => setShowSharePoster(true)}
            className='gap-2'
          >
            <Share2 className='h-4 w-4' />
            生成分享海报
          </Button>
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

      {/* 分享海报弹窗 */}
      <SharePoster
        open={showSharePoster}
        onOpenChange={setShowSharePoster}
        candidateName={candidateName}
        score={score}
        position="前端专家"
        date={getInterviewDate()}
      />
    </>
  )
}
