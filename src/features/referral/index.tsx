import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { fetchTalentMe } from '@/lib/api'
import { getWalletDetails, type WalletDetailsResponse } from '@/features/wallet/api'
import RecommendMeTab from '@/features/referral/components/recommend-me-tab'
import ReferralListTab from '@/features/referral/components/referral-list-tab'
import ShareBubble from '@/features/referral/components/share-bubble'
import PosterGenerator from '@/features/referral/components/poster-generator'
import ReferralFlowSection from '@/features/referral/components/referral-flow-section'
import { ReferralTab, DEFAULT_REFERRAL_TAB } from '@/features/referral/constants'
import { toast } from 'sonner'

export default function ReferralPage() {
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_REFERRAL_TAB)
  const [shouldGeneratePoster, setShouldGeneratePoster] = useState(false)

  // 获取当前用户信息
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchTalentMe,
    staleTime: 5 * 60 * 1000,
  })

  // 获取钱包数据，用于判断任务收入
  const { data: walletDetails } = useQuery<WalletDetailsResponse>({
    queryKey: ['wallet-details'],
    queryFn: async () => getWalletDetails(),
    staleTime: 30 * 1000,
  })

  // 从钱包数据中获取任务收入
  const totalIncome = walletDetails?.wallet.refer_income ?? 0

  const handleGeneratePoster = () => {
    // 防止重复触发
    if (shouldGeneratePoster) {
      return
    }
    // 检查是否有邀请码
    if (!currentUser?.referral_code) {
      toast.error('邀请码尚未加载，请稍后重试')
      return
    }
    setShouldGeneratePoster(true)
  }

  const handlePosterGenerated = (dataUrl: string) => {
    // 立即设置状态，防止重复生成
    setShouldGeneratePoster(false)
    
    // 下载图片
    const link = document.createElement('a')
    link.download = `内推海报_${currentUser?.full_name || currentUser?.referral_code || 'poster'}.jpg`
    link.href = dataUrl
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    // 延迟清理，确保下载已触发
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)
    
    toast.success('海报已生成并下载！')
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='overflow-y-auto py-0 pb-24 md:mx-16 md:pb-0'>
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

        {/* 分享区域 - 移动端显示在 Tab 上方，桌面端固定在右侧 */}
        {Number(totalIncome) > 0 && (
          <ShareBubble
            totalIncome={Number(totalIncome)}
            onGeneratePoster={handleGeneratePoster}
            className='mb-6 md:mb-0'
            mobileInline
          />
        )}

        {/* Tab 切换 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
          <TabsList className='grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value={ReferralTab.LIST}>内推列表</TabsTrigger>
            <TabsTrigger value={ReferralTab.RECOMMEND_ME}>推荐我</TabsTrigger>
          </TabsList>

          {/* 推荐流程 - 仅在内推列表 Tab 显示 */}
          {activeTab === ReferralTab.LIST && (
            <ReferralFlowSection />
          )}

          <TabsContent value={ReferralTab.LIST} className='space-y-4'>
            <ReferralListTab isActive={activeTab === ReferralTab.LIST} />
          </TabsContent>

          <TabsContent value={ReferralTab.RECOMMEND_ME} className='space-y-4'>
            <RecommendMeTab isActive={activeTab === ReferralTab.RECOMMEND_ME} />
          </TabsContent>
        </Tabs>

      {/* 海报生成器（隐藏的canvas） */}
      {shouldGeneratePoster && currentUser?.referral_code && (
        <PosterGenerator
          data={{
            totalIncome,
            inviteCode: currentUser.referral_code,
            userName: currentUser.full_name,
          }}
          onGenerated={handlePosterGenerated}
        />
      )}
      </Main>
    </>
  )
}

