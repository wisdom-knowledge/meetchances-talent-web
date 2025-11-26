import { useQuery } from '@tanstack/react-query'
import { IconCopy } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { fetchTalentMe } from '@/lib/api'
import { userEvent } from '@/lib/apm'

// Campaign 类型定义
export interface Campaign {
  name: string
  project_id?: number
  status: 'ACTIVE' | 'ENDED'
  type: 'referral_reward' | 'full_order_reward'
  start_date?: string
  end_date?: string
  condition_type: 'pass_questions' | 'complete_working_hours'
  quantity?: number
  reward?: string
  id: number
  created_at: string
  updated_at: string
}

export interface Project {
  id?: number
  alias?: string
  name?: string
}

export interface ReferralSectionProps {
  jobId: string | number
  referralBonus: number
  campaign?: Campaign
  project?: Project
  className?: string
}

// 格式化活动描述组件
function CampaignDescription({ campaign, project, fallbackBonus }: { campaign?: Campaign, project?: Project, fallbackBonus?: number }) {
  if (!campaign) {
    // 没有 campaign 数据时，使用 fallbackBonus
    if (fallbackBonus && fallbackBonus > 0) {
      return (
        <>
          您邀请的新专家加入该项目并通过录取后完成任务，您即可获得
          <span className='mx-1 font-semibold text-gray-900'>¥{fallbackBonus}</span>
          内推奖励！
        </>
      )
    }
    return <>您邀请的新专家加入该项目并通过录取后完成任务，您即可获得内推奖励！</>
  }

  // 优先使用 project.alias，其次使用 project.name，最后使用 '该项目'
  const projectName = (project?.alias || project?.name || '该项目').toUpperCase()
  const endDate = campaign.end_date || ''
  const quantity = campaign.quantity || 0
  const reward = campaign.reward || '0'

  // 根据完成条件类型生成文案
  if (campaign.condition_type === 'pass_questions') {
    return (
      <>
        您邀请的新专家加入
        <span className='mx-1 font-semibold text-gray-900'>{projectName}</span>
        项目并通过录取后，只需
        {endDate && (
          <>
            在<span className='mx-1 font-semibold text-gray-900'>{endDate} 23:59</span>前
          </>
        )}
        提交至少<span className='mx-1 font-semibold text-gray-900'>{quantity}</span>条任务，且该任务在后续审核中被结算，您即可获得
        <span className='mx-1 font-semibold text-gray-900'>¥{reward}</span>内推奖励！
      </>
    )
  } else {
    return (
      <>
        您邀请的新专家加入
        <span className='mx-1 font-semibold text-gray-900'>{projectName}</span>
        项目并通过录取后，只需
        {endDate && (
          <>
            在<span className='mx-1 font-semibold text-gray-900'>{endDate} 23:59</span>前
          </>
        )}
        完成至少<span className='mx-1 font-semibold text-gray-900'>{quantity}</span>小时工作，且这
        <span className='mx-1 font-semibold text-gray-900'>{quantity}</span>小时在后续审核中被结算，您即可获得
        <span className='mx-1 font-semibold text-gray-900'>¥{reward}</span>内推奖励！
      </>
    )
  }
}

// PC 端组件
function DesktopReferralSection({ jobId, referralBonus, campaign, project, className }: ReferralSectionProps) {
  const auth = useAuthStore((s) => s.auth)

  // 从 /talent/me 接口获取用户邀请码
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchTalentMe,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(auth.user),
  })

  const inviteToken = currentUser?.referral_code || ''

  const handleCopyReferralCode = async () => {
    // 检查登录状态
    if (!auth.user) {
      // 未登录，跳转到 OAuth 授权页面
      const loginUrl = import.meta.env.VITE_AUTH_LOGIN_URL
      if (loginUrl) {
        window.location.href = loginUrl
      }
      return
    }

    if (!inviteToken) {
      toast.error('邀请码尚未加载，请稍后重试')
      return
    }

    // 拼接完整的邀请链接
    const origin = window.location.origin
    const inviteUrl = `${origin}/referral?invitedCode=${inviteToken}`

    // 复制到剪贴板
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('邀请链接已复制到剪贴板')
      userEvent('referral_code_copied', '复制邀请码', { job_id: jobId })
    } catch (_error) {
      toast.error('复制失败，请稍后重试')
    }
  }

  return (
    <div className={cn('py-4', className)}>
      <div className='relative overflow-hidden rounded-xl border border-[#E0E7FF] bg-gradient-to-br from-[#F5F3FF] via-white to-[#FAF5FF] p-5 shadow-sm transition-all hover:shadow-md'>
        {/* 装饰性背景元素 */}
        <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#4E02E4] opacity-5' />
        <div className='pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[#C994F7] opacity-5' />
        
        <div className='relative'>
          {/* 标题 */}
          <div className='mb-3 flex items-center gap-2'>
            <span className='bg-gradient-to-r from-[#4E02E4] to-[#8B5CF6] bg-clip-text text-base font-bold text-transparent'>
              限时内推活动
            </span>
          </div>

          {/* 活动说明 */}
          <div className='mb-4 rounded-lg bg-white/60 p-3 text-sm leading-relaxed text-gray-700 backdrop-blur-sm'>
            <CampaignDescription campaign={campaign} project={project} fallbackBonus={referralBonus} />
            <a
              href='https://meetchances.feishu.cn/wiki/UBhPw7ypki1rj3kglZwcLLUPnDb'
              target='_blank'
              rel='noopener noreferrer'
              className='ml-1 font-medium text-[#4E02E4] underline decoration-dotted underline-offset-2 transition-colors hover:text-[#3D01B3]'
            >
              查看详细规则 →
            </a>
          </div>

          {/* 复制区域 */}
          <div className='flex items-center gap-3'>
            <div className='flex-1'>
              <div 
                className='rounded-lg border-2 border-dashed border-[#E0E7FF] bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-[#C994F7]'
                onClick={handleCopyReferralCode}
              >
                {isLoading ? '加载中...' : (inviteToken || (auth.user ? '邀请码加载失败' : '登录后即可获取邀请码'))}
              </div>
            </div>
            <Button
              onClick={handleCopyReferralCode}
              disabled={isLoading || !inviteToken}
              className='group flex h-11 items-center gap-2 !rounded-lg !bg-gradient-to-r !from-[#4E02E4] !to-[#8B5CF6] !px-5 !py-2.5 !text-sm !font-medium !text-white !shadow-lg !shadow-purple-500/30 !transition-all hover:!shadow-xl hover:!shadow-purple-500/40 disabled:!opacity-50'
            >
              <IconCopy className='h-4 w-4 transition-transform group-hover:scale-110' />
              复制邀请码
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 移动端组件
function MobileReferralSection({ jobId, referralBonus, campaign, project, className }: ReferralSectionProps) {
  const auth = useAuthStore((s) => s.auth)

  // 从 /talent/me 接口获取用户邀请码
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchTalentMe,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(auth.user),
  })

  const inviteToken = currentUser?.referral_code || ''

  const handleCopyReferralCode = async () => {
    // 检查登录状态
    if (!auth.user) {
      // 未登录，跳转到 OAuth 授权页面
      const loginUrl = import.meta.env.VITE_AUTH_LOGIN_URL
      if (loginUrl) {
        window.location.href = loginUrl
      }
      return
    }

    if (!inviteToken) {
      toast.error('邀请码尚未加载，请稍后重试')
      return
    }

    // 拼接完整的邀请链接
    const origin = window.location.origin
    const inviteUrl = `${origin}/referral?invitedCode=${inviteToken}`

    // 复制到剪贴板
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('邀请链接已复制到剪贴板')
      userEvent('referral_code_copied', '复制邀请码', { job_id: jobId })
    } catch (_error) {
      toast.error('复制失败，请稍后重试')
    }
  }

  return (
    <div className={cn('py-3', className)}>
      <div className='relative overflow-hidden rounded-xl border border-[#E0E7FF] bg-gradient-to-br from-[#F5F3FF] via-white to-[#FAF5FF] p-4 shadow-sm'>
        {/* 装饰性背景元素 */}
        <div className='pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#4E02E4] opacity-5' />
        <div className='pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[#C994F7] opacity-5' />
        
        <div className='relative'>
          {/* 标题 */}
          <div className='mb-2.5 flex items-center gap-1.5'>
            <span className='bg-gradient-to-r from-[#4E02E4] to-[#8B5CF6] bg-clip-text text-sm font-bold text-transparent'>
              限时内推活动
            </span>
          </div>

          {/* 活动说明 */}
          <div className='mb-3 rounded-lg bg-white/60 p-2.5 text-xs leading-relaxed text-gray-700 backdrop-blur-sm'>
            <CampaignDescription campaign={campaign} project={project} fallbackBonus={referralBonus} />
            <a
              href='https://meetchances.feishu.cn/wiki/UBhPw7ypki1rj3kglZwcLLUPnDb'
              target='_blank'
              rel='noopener noreferrer'
              className='ml-1 font-medium text-[#4E02E4] underline decoration-dotted underline-offset-2'
            >
              查看规则 →
            </a>
          </div>

          {/* 复制区域 */}
          <div className='space-y-2.5'>
            <div 
              className='rounded-lg border-2 border-dashed border-[#E0E7FF] bg-white px-3 py-2.5 text-xs font-medium text-gray-900'
              onClick={handleCopyReferralCode}
            >
              {isLoading ? '加载中...' : (inviteToken || (auth.user ? '邀请码加载失败' : '登录后即可获取邀请码'))}
            </div>
            <Button
              onClick={handleCopyReferralCode}
              disabled={isLoading || !inviteToken}
              className='group flex h-10 w-full items-center justify-center gap-2 !rounded-lg !bg-gradient-to-r !from-[#4E02E4] !to-[#8B5CF6] !px-4 !py-2 !text-sm !font-medium !text-white !shadow-lg !shadow-purple-500/30 disabled:!opacity-50'
            >
              <IconCopy className='h-4 w-4 transition-transform group-active:scale-95' />
              复制邀请码
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReferralSection(props: ReferralSectionProps) {
  const isMobile = useIsMobile()

  return isMobile ? <MobileReferralSection {...props} /> : <DesktopReferralSection {...props} />
}

