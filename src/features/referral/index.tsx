import { useState, useEffect } from 'react'
import { useSearch } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileDropdown } from '@/components/profile-dropdown'
import RecommendMeTab from '@/features/referral/components/recommend-me-tab'
import ReferralListTab from '@/features/referral/components/referral-list-tab'
import ReferrableJobsTab from '@/features/referral/components/referrable-jobs-tab'
import ReferralFlowSection from '@/features/referral/components/referral-flow-section'
import CanReferralSection from '@/features/referral/components/can-referral-section'
import { ReferralTab, DEFAULT_REFERRAL_TAB } from '@/features/referral/constants'

export default function ReferralPage() {
  // 读取 URL 参数
  const searchParams = useSearch({ from: '/_authenticated/referral' })
  const invitedCodeFromUrl = searchParams.invitedCode

  // 如果 URL 中有 invitedCode，自动切换到推荐我 tab
  const initialTab = invitedCodeFromUrl ? ReferralTab.RECOMMEND_ME : DEFAULT_REFERRAL_TAB
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  // 当 URL 参数变化时，自动切换 tab
  useEffect(() => {
    if (invitedCodeFromUrl) {
      setActiveTab(ReferralTab.RECOMMEND_ME)
    }
  }, [invitedCodeFromUrl])

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='py-0 md:mx-16'>
        {/* 标题和描述在一行 */}
        <div className='md:flex md:items-end md:gap-4'>
          <h1 className='text-xl font-bold tracking-tight md:text-2xl'>内推</h1>
          <p className='text-muted-foreground text-sm'>
            推荐朋友，共享快乐！
            <a
              href='https://meetchances.feishu.cn/wiki/UBhPw7ypki1rj3kglZwcLLUPnDb'
              target='_blank'
              rel='noopener noreferrer'
              className='ml-1 font-medium text-[#4E02E4] underline decoration-dotted underline-offset-2 transition-colors hover:text-[#3D01B3]'
            >
              内推详细规则
            </a>
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* Tab 切换 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='flex flex-1 min-h-0 flex-col'>
          <TabsList className='grid w-full max-w-lg grid-cols-3 shrink-0'>
            <TabsTrigger value={ReferralTab.REFERRABLE_JOBS}>可推荐岗位</TabsTrigger>
            <TabsTrigger value={ReferralTab.LIST}>我推荐的</TabsTrigger>
            <TabsTrigger value={ReferralTab.RECOMMEND_ME}>推荐我</TabsTrigger>
          </TabsList>

          <TabsContent value={ReferralTab.REFERRABLE_JOBS} className='flex-1 min-h-0 overflow-hidden'>
            <div className='flex flex-col h-full overflow-y-auto pb-24 md:pb-0' style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* 可推荐流程说明 */}
              <div className='shrink-0 mb-4 overflow-x-auto'>
                <CanReferralSection />
              </div>
              {/* 岗位列表 */}
              <div className='flex-1 min-h-0'>
                <ReferrableJobsTab isActive={activeTab === ReferralTab.REFERRABLE_JOBS} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value={ReferralTab.LIST} className='flex-1 min-h-0 overflow-hidden'>
            <div className='flex flex-col h-full overflow-y-auto pb-24 md:pb-0' style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* 推荐流程 - 仅在内推列表 Tab 显示 */}
              <div className='shrink-0 mb-4 overflow-x-auto'>
                <ReferralFlowSection />
              </div>
              {/* 列表内容 */}
              <div className='shrink-0'>
                <ReferralListTab isActive={activeTab === ReferralTab.LIST} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value={ReferralTab.RECOMMEND_ME} className='flex-1 min-h-0 overflow-auto pb-24 md:pb-0'>
            <RecommendMeTab 
              isActive={activeTab === ReferralTab.RECOMMEND_ME} 
              initialInviteCode={invitedCodeFromUrl}
            />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

