import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { fetchTalentMe } from '@/lib/api'
import RecommendMeTab from '@/features/referral/components/recommend-me-tab'
import ShareBubble from '@/features/referral/components/share-bubble'
import PosterGenerator from '@/features/referral/components/poster-generator'
import { toast } from 'sonner'

export default function ReferralPage() {
  const [shouldGeneratePoster, setShouldGeneratePoster] = useState(false)

  // 获取当前用户信息
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchTalentMe,
    staleTime: 5 * 60 * 1000,
  })

  // 收入数据默认为 0，后续联调时再对接接口
  const totalIncome = 0
  const currentMonthIncome = 0

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

      <Main fixed className='overflow-y-auto py-0 md:mx-16'>
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

        {/* 推荐我内容 */}
        <div className='space-y-4'>
          <RecommendMeTab isActive={true} />
        </div>

      {/* 海报生成器（隐藏的canvas） */}
      {shouldGeneratePoster && currentUser?.referral_code && (
        <PosterGenerator
          data={{
            totalIncome,
            currentMonthIncome,
            inviteCode: currentUser.referral_code,
            userName: currentUser.full_name,
          }}
          onGenerated={handlePosterGenerated}
        />
      )}
      </Main>

      {/* 分享区域 - 固定定位在右侧，仅当任务收入大于 0 时显示 */}
      {totalIncome > 0 && (
        <ShareBubble
          totalIncome={totalIncome}
          onGeneratePoster={handleGeneratePoster}
        />
      )}
    </>
  )
}

