import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'

import { Separator } from '@/components/ui/separator'
import CandidateInfoSection from './components/candidate-info-section'
import SkillAssessmentSection from './components/skill-assessment-section'
import InterviewRecordingSection from './components/interview-recording-section'
import ProctoringResultSection from './components/proctoring-result-section'
import AboutCandidateSection from './components/about-candidate-section'
import CandidateSkillsSection from './components/candidate-skills-section'
import WorkExperienceSection from './components/work-experience-section'
import EducationSection from './components/education-section'
import { interviewReportData } from './data/skills-data'

export default function InterviewReports() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main fixed>
        
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            面试分析报告
          </h1>

        <Separator className='mt-6 shadow-sm' />
        </div>
        <div className='py-6 overflow-y-auto'>
        
        {/* 候选人基本信息 */}
        <CandidateInfoSection candidate={interviewReportData.candidate} />
        
        <Separator className='my-4 lg:my-6' />
        {/* 技能考核综合结果 */}
        <SkillAssessmentSection skills={interviewReportData.skills} />
        
        {/* AI面试对话记录 */}
        <InterviewRecordingSection data={interviewReportData.recording} />
        
        {/* AI面试监考结果 */}
        <ProctoringResultSection data={interviewReportData.proctoring} />
        
        {/* 关于候选人 */}
        <AboutCandidateSection data={interviewReportData.about} />
        
        {/* 候选人技能 */}
        <CandidateSkillsSection data={interviewReportData.candidateSkills} />
        
        {/* 工作经历 */}
        <WorkExperienceSection data={interviewReportData.workExperience} />
        
        {/* 教育经历 */}
        <EducationSection data={interviewReportData.education} />
        </div>
        
      </Main>
    </>
  )
}

// 所有mock数据现已整合到 data/skills-data.tsx 中

const topNav = [
  {
    title: '报告列表',
    href: 'interview-reports/list',
    isActive: true,
    disabled: false,
  },
  {
    title: '统计分析',
    href: 'interview-reports/analytics',
    isActive: false,
    disabled: true,
  },
  {
    title: '设置',
    href: 'interview-reports/settings',
    isActive: false,
    disabled: true,
  },
]
