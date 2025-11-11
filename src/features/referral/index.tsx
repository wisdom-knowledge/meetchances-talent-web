import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import experienceQr from '@/assets/images/home-experience.jfif'
import officialQr from '@/assets/images/home-official.jfif'
import withdrawReleaseQr from '@/assets/images/withdraw_release.jfif'
import withdrawTrialQr from '@/assets/images/withdraw_trial.jfif'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { getReferralIncome, type ReferralIncomeData } from '@/features/referral/api'
import { ReferralTab, DEFAULT_REFERRAL_TAB } from '@/features/referral/constants'
import ReferralListTab from '@/features/referral/components/referral-list-tab'
import RecommendMeTab from '@/features/referral/components/recommend-me-tab'
import ShareBubble from '@/features/referral/components/share-bubble'
import PosterGenerator from '@/features/referral/components/poster-generator'
import PaymentRecordsTab from '@/features/wallet/components/payment-records-tab'
import PaymentMethodsTab from '@/features/wallet/components/payment-methods-tab'
import { formatCurrency } from '@/features/wallet/utils'
import { detectRuntimeEnvSync } from '@/lib/env'
import type { Talent } from '@/stores/authStore'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  name: string
  channel: '微信支付'
  isBound: boolean
  isSelected: boolean
  description?: string
}

interface WalletDashboard {
  paymentMethods: PaymentMethod[]
}

const fetchWalletDashboard = async (): Promise<WalletDashboard> => {
  const isBound = false

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        paymentMethods: [
          {
            id: 'wechat-pay',
            name: '微信支付',
            channel: '微信支付',
            isBound: isBound,
            isSelected: isBound,
            description: '用于千识任务与奖金额度的结算收款。',
          },
        ],
      })
    }, 320)
  })
}

export default function ReferralPage() {
  const [activeTab, setActiveTab] = useState(DEFAULT_REFERRAL_TAB)
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [posterDataUrl, setPosterDataUrl] = useState<string>('')
  const [shouldGeneratePoster, setShouldGeneratePoster] = useState(false)

  const queryClient = useQueryClient()

  // 获取付款方式mock数据（复用wallet的）
  const { data: walletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet-dashboard'],
    queryFn: fetchWalletDashboard,
  })

  const appEnv = (import.meta.env.VITE_APP_ENV as string) || (import.meta.env.PROD ? 'prod' : 'dev')
  const qrCodeImageSrc = appEnv === 'prod' ? officialQr : experienceQr
  const withdrawQrImageSrc = appEnv === 'prod' ? withdrawReleaseQr : withdrawTrialQr

  const paymentMethods = useMemo(
    () => walletData?.paymentMethods ?? [],
    [walletData?.paymentMethods]
  )

  // 使用 /talent/me 的 miniprogram_openid 判断是否绑定了微信支付
  const currentUser = queryClient.getQueryData(['current-user']) as Talent | undefined
  const isWeChatBound = Boolean(currentUser?.miniprogram_openid)
  const patchedPaymentMethods = useMemo(
    () =>
      paymentMethods.map((m) =>
        m.id === 'wechat-pay' ? { ...m, isBound: isWeChatBound, isSelected: isWeChatBound } : m,
      ),
    [paymentMethods, isWeChatBound],
  )

  // 获取内推收入数据
  const { data: incomeData, isLoading: isIncomeLoading } = useQuery<ReferralIncomeData>({
    queryKey: ['referral-income'],
    queryFn: getReferralIncome,
    staleTime: 30 * 1000,
  })

  const totalIncome = incomeData?.total_income ?? 0
  const currentMonthIncome = incomeData?.current_month_income ?? 0
  const pendingAmount = incomeData?.pending_amount ?? 0

  const handleBindClick = () => {
    const env = detectRuntimeEnvSync()
    // 小程序端直接跳转授权页面
    if (env === 'wechat-miniprogram') {
      if (typeof window !== 'undefined') {
        const wxAny = (window as unknown as {
          wx?: { miniProgram?: { navigateTo?: (config: { url: string }) => void } }
        }).wx
        wxAny?.miniProgram?.navigateTo?.({
          url: 'pages/authorize/authorize?bind=2',
        })
        return
      }
    }
    setBindingDialogOpen(true)
  }

  const handleWithdrawClick = () => {
    const env = detectRuntimeEnvSync()
    // 小程序端直接跳转提现页面
    if (env === 'wechat-miniprogram') {
      if (typeof window !== 'undefined') {
        const wxAny = (window as unknown as {
          wx?: { miniProgram?: { navigateTo?: (config: { url: string }) => void } }
        }).wx
        wxAny?.miniProgram?.navigateTo?.({
          url: '/pages/withdraw/withdraw',
        })
        return
      }
    }
    // 非小程序端，弹窗展示小程序码
    setWithdrawDialogOpen(true)
  }

  const handleGeneratePoster = () => {
    // 防止重复触发
    if (shouldGeneratePoster) {
      return
    }
    // 测试模式：邀请码已写死，不需要检查用户信息
    setShouldGeneratePoster(true)
  }

  const handlePosterGenerated = (dataUrl: string) => {
    // 立即设置状态，防止重复生成
    setShouldGeneratePoster(false)
    setPosterDataUrl(dataUrl)
    
    // 下载图片
    const link = document.createElement('a')
    link.download = `内推海报_${currentUser?.username || 'poster'}.jpg`
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
              href='#'
              className='ml-1 font-medium text-[#4E02E4] underline decoration-dotted underline-offset-2 transition-colors hover:text-[#3D01B3]'
              onClick={(e) => {
                e.preventDefault()
                // TODO: 替换为实际的规则链接
              }}
            >
              内推详细规则
            </a>
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 收入卡片 - 各占1/3宽度 */}
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch'>
          {/* 任务收入卡片 */}
          <div className='bg-card w-full rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A] sm:w-1/3'>
            <div className='space-y-2 p-4 md:p-6'>
              <h3 className='text-muted-foreground text-sm font-medium'>
                任务收入（税前）
              </h3>
              <p className='text-foreground text-3xl font-semibold'>
                {isIncomeLoading ? '加载中…' : formatCurrency(totalIncome)}
              </p>
              <p className='text-muted-foreground text-sm'>
                {isIncomeLoading ? '加载中…' : `${formatCurrency(currentMonthIncome)} 本月收入`}
              </p>
            </div>
          </div>

          {/* 待发放卡片 */}
          <div className='bg-card w-full rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A] sm:w-1/3'>
            <div className='space-y-2 p-4 md:p-6'>
              <h3 className='text-muted-foreground text-sm font-medium'>
                待发放（税前）
              </h3>
              <p className='text-foreground text-3xl font-semibold'>
                {isIncomeLoading ? '加载中…' : formatCurrency(pendingAmount)}
              </p>
            </div>
          </div>
        </div>

      {/* 绑定/提现卡片 - 100%宽度 */}
      <div className='bg-card mb-6 rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A]'>
        <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
          {isWalletLoading ? (
            <p className='text-muted-foreground text-sm'>
              正在加载付款方式绑定信息…
            </p>
          ) : !isWeChatBound ? (
            <div className='text-muted-foreground space-y-1 text-sm'>
              <p>您还没绑定付款方式，为顺利支付，请先绑定</p>
            </div>
          ) : pendingAmount > 10000 ? (
            <div className='text-muted-foreground space-y-1 text-sm'>
              <p>如需大额提现，请点击「需求帮助」联系客服</p>
            </div>
          ) : (
            <div className='text-muted-foreground space-y-1 text-sm'>
              <p>请到一面千识微信小程序 - 钱包点击提现</p>
            </div>
          )}

          {!isWalletLoading && (
            !isWeChatBound ? (
              <Button size='sm' onClick={handleBindClick}>
                绑定
              </Button>
            ) : (
              <Button size='sm' onClick={handleWithdrawClick}>
                提现
              </Button>
            )
          )}
        </div>
      </div>

      {/* Tab切换 */}
      <div className='space-y-4'>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1'>
            <TabsTrigger value={ReferralTab.LIST}>内推列表</TabsTrigger>
            <TabsTrigger value={ReferralTab.PAYMENT_RECORDS}>付款记录</TabsTrigger>
            <TabsTrigger value={ReferralTab.PAYMENT_METHODS}>付款方式</TabsTrigger>
            <TabsTrigger value={ReferralTab.RECOMMEND_ME}>推荐我</TabsTrigger>
          </TabsList>

          <TabsContent value={ReferralTab.LIST} className='space-y-4'>
            <ReferralListTab isActive={activeTab === ReferralTab.LIST} />
          </TabsContent>

          <TabsContent value={ReferralTab.PAYMENT_RECORDS} className='space-y-4'>
            <PaymentRecordsTab isActive={activeTab === ReferralTab.PAYMENT_RECORDS} />
          </TabsContent>

          <TabsContent value={ReferralTab.PAYMENT_METHODS} className='space-y-4'>
            <PaymentMethodsTab
              isLoading={isWalletLoading}
              paymentMethods={patchedPaymentMethods}
              onOpenBind={() => handleBindClick()}
            />
          </TabsContent>

          <TabsContent value={ReferralTab.RECOMMEND_ME} className='space-y-4'>
            <RecommendMeTab isActive={activeTab === ReferralTab.RECOMMEND_ME} />
          </TabsContent>
        </Tabs>
      </div>

      {/* 绑定弹窗 */}
      <Dialog open={bindingDialogOpen} onOpenChange={setBindingDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>绑定付款方式</DialogTitle>
            <DialogDescription>
              扫描下方小程序二维码，完成微信支付绑定后即可接收千识任务收入款项。
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col items-center gap-4'>
            <img
              src={qrCodeImageSrc}
              alt='支付绑定小程序码'
              className='border-muted-foreground/40 bg-muted/30 h-48 w-48 rounded-xl border border-dashed object-cover'
            />
            <p className='text-muted-foreground text-center text-xs'>
              请使用微信扫一扫功能完成绑定。
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 提现弹窗 */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>前往提现</DialogTitle>
            <DialogDescription>
              扫描下方小程序码，进入一面千识小程序提现页面。
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col items-center gap-4'>
            <img
              src={withdrawQrImageSrc}
              alt='提现小程序码'
              className='border-muted-foreground/40 bg-muted/30 h-48 w-48 rounded-xl border border-dashed object-cover'
            />
            <p className='text-muted-foreground text-center text-xs'>
              请使用微信扫一扫功能进入提现页面。
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 海报生成器（隐藏的canvas） */}
      {shouldGeneratePoster && currentUser?.username && (
        <PosterGenerator
          data={{
            totalIncome,
            currentMonthIncome,
            inviteCode: currentUser.username,
            userName: currentUser.full_name,
          }}
          onGenerated={handlePosterGenerated}
        />
      )}
      </Main>

      {/* 分享区域 - 固定定位在右侧 */}
      <ShareBubble
        totalIncome={totalIncome}
        onGeneratePoster={handleGeneratePoster}
      />
    </>
  )
}

