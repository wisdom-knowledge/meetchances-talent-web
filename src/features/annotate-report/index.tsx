import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
 
import { Search } from '@/components/search'

import { Separator } from '@/components/ui/separator'
import CandidateInfoSection from './components/candidate-info-section'
import AiRecommendationSection from './components/ai-recommendation-section'
import TaskDetailsSection from './components/task-details-section'
import { annotateReportData } from './data/mock'

export default function AnnotateReport() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <a
            href='http://meetchances.com/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            关于我们
          </a>
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl mb-2'>
            试标报告
          </h1>
          <Separator className='mt-6 shadow-sm' />
        </div>

        <div className='py-6 overflow-y-auto'>
          {/* 顶部 — 用户信息 */}
          <CandidateInfoSection candidate={annotateReportData.candidate} />

          {/* AI 推荐评分 */}
          <AiRecommendationSection data={annotateReportData.aiRecommendation} />

          {/* 试标任务详情 */}
          <TaskDetailsSection data={annotateReportData.taskDetails} />
        </div>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: '报告列表',
    href: 'annotate-report/list',
    isActive: true,
    disabled: false,
  },
  {
    title: '统计分析',
    href: 'annotate-report/analytics',
    isActive: false,
    disabled: true,
  },
  {
    title: '设置',
    href: 'annotate-report/settings',
    isActive: false,
    disabled: true,
  },
]


