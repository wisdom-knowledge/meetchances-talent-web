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
import { ProfileDropdown } from '@/components/profile-dropdown'
import TitleBar from '@/components/title-bar'
import { getWalletDetails, type WalletDetailsResponse } from '@/features/wallet/api'
import IncomeTab from '@/features/wallet/components/income-tab'
import PaymentRecordsTab from '@/features/wallet/components/payment-records-tab'
import PaymentMethodsTab from '@/features/wallet/components/payment-methods-tab'
// import RealNameTab from '@/features/wallet/components/realname-tab'
import { formatCurrency } from '@/features/wallet/utils'
import { detectRuntimeEnvSync } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { Talent } from '@/stores/authStore'

// 类型由子组件内部各自定义

interface WalletOverview {
  grossTaskIncome: number
  currentMonthIncome: number
  pendingPreTax: number
}

interface BindingInfo {
  isPaymentMethodBound: boolean
  qrCodeDescription?: string
}



interface PaymentMethod {
  id: string
  name: string
  channel: '微信支付'
  isBound: boolean
  isSelected: boolean
  description?: string
}

interface RealNameVerification {
  isVerified: boolean
  fullName?: string
  idNumber?: string
}

interface WalletDashboard {
  overview: WalletOverview
  binding: BindingInfo
  paymentMethods: PaymentMethod[]
  realNameVerification: RealNameVerification
}

// 子组件各自处理分页与表单

// 已移除本地 mock 列表，收入与付款记录由子组件各自请求

const fetchWalletDashboard = async (): Promise<WalletDashboard> => {
  const isBound = false

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        overview: {
          grossTaskIncome: 12860.58,
          currentMonthIncome: 5320.75,
          pendingPreTax: 1820.4,
        },
        binding: {
          isPaymentMethodBound: isBound,
          qrCodeDescription: '使用微信扫描二维码即可绑定千识任务收入收款账户。',
        },
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
        realNameVerification: {
          isVerified: false,
        },
      })
    }, 320)
  })
}

// 工具函数与状态徽标由子组件自行处理

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('income')
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [showServiceTip, setShowServiceTip] = useState(false)


  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-dashboard'],
    queryFn: fetchWalletDashboard,
  })

  const appEnv = (import.meta.env.VITE_APP_ENV as string) || (import.meta.env.PROD ? 'prod' : 'dev')
  const qrCodeImageSrc = appEnv === 'prod' ? officialQr : experienceQr
  const withdrawQrImageSrc = appEnv === 'prod' ? withdrawReleaseQr : withdrawTrialQr

  // const overview = data?.overview
  const binding = data?.binding
  // const realNameVerification = data?.realNameVerification
  const paymentMethods = useMemo(
    () => data?.paymentMethods ?? [],
    [data?.paymentMethods]
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



  // 余额（任务收入总额与可提现余额）
  const { data: walletDetails, isLoading: isWalletLoading } =
    useQuery<WalletDetailsResponse>({
      queryKey: ['wallet-details'],
      queryFn: async () => getWalletDetails(),
      staleTime: 30 * 1000,
    })
  const availableBalance = walletDetails?.wallet.available_balance ?? 0
  const taskIncomeTotal = walletDetails?.wallet.total_income ?? 0

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

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='overflow-y-auto py-0 md:mx-16'>
        <TitleBar title='钱包' back separator />

        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch'>
          <div className='bg-card flex-1 rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A]'>
            <div className='space-y-2 p-4 md:p-6'>
              <h3 className='text-muted-foreground text-sm font-medium'>
                任务收入（税前）
              </h3>
              <p className='text-foreground text-3xl font-semibold'>
                {isWalletLoading ? '加载中…' : formatCurrency(taskIncomeTotal)}
              </p>
              <p className='text-muted-foreground text-sm'>
                {isWalletLoading
                  ? '加载中…'
                  : walletDetails?.wallet.current_month_income !== undefined
                  ? `${formatCurrency(walletDetails.wallet.current_month_income)} 本月收入`
                  : '-'}
              </p>
            </div>
          </div>

          <div className='bg-card flex-1 rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A]'>
            <div className='space-y-2 p-4 md:p-6'>
              <h3 className='text-muted-foreground text-sm font-medium'>
                待提现
              </h3>
              <p className='text-foreground text-3xl font-semibold'>
                {isWalletLoading
                  ? '加载中…'
                  : formatCurrency(availableBalance)}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-card mb-6 rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A]'>
          <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
            {isLoading ? (
              <p className='text-muted-foreground text-sm'>
                正在加载付款方式绑定信息…
              </p>
            ) : !isWeChatBound ? (
              <div className='text-muted-foreground space-y-1 text-sm'>
                <p>您还没绑定付款方式，为顺利支付，请先绑定</p>
              </div>
            ) : availableBalance > 10000 ? (
              <div className='text-muted-foreground space-y-1 text-sm'>
                <p>如需大额提现，请点击「需求帮助」联系客服</p>
              </div>
            ) : (
              <div className='text-muted-foreground space-y-1 text-sm'>
                <p>请到一面千识微信小程序 - 钱包点击提现</p>
              </div>
            )}

            {!isLoading && (
              !isWeChatBound ? (
                <Button size='sm' onClick={handleBindClick}>
                  绑定
                </Button>
              ) : availableBalance > 10000 ? null : (
                <Button size='sm' onClick={handleWithdrawClick}>
                  提现
                </Button>
              )
            )}
          </div>
        </div>

        <div className='space-y-4'>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1'>
              <TabsTrigger value='income'>收入</TabsTrigger>
              <TabsTrigger value='payment'>付款记录</TabsTrigger>
              <TabsTrigger value='method'>付款方式</TabsTrigger>
              {/* <TabsTrigger value='realname'>实名认证</TabsTrigger> */}
            </TabsList>

            <TabsContent value='income' className='space-y-4'>
              <IncomeTab isActive={activeTab === 'income'} />
            </TabsContent>

            <TabsContent value='payment' className='space-y-4'>
              <PaymentRecordsTab isActive={activeTab === 'payment'} />
            </TabsContent>

            <TabsContent value='method' className='space-y-4'>
              <PaymentMethodsTab
                isLoading={isLoading}
                paymentMethods={patchedPaymentMethods}
                onOpenBind={() =>  handleBindClick()}
              />
            </TabsContent>

            {/* <TabsContent value='realname' className='space-y-4'>
              <RealNameTab isLoading={isLoading} realName={realNameVerification} />
            </TabsContent> */}

            {/* old inline tab contents removed */}
          </Tabs>
        </div>
      </Main>

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
            {binding?.qrCodeDescription && (
              <p className='text-muted-foreground text-center text-xs'>
                {binding.qrCodeDescription}
              </p>
            )}
            <Button
              size='sm'
              onClick={async () => {
                await new Promise((resolve) => setTimeout(resolve, 300))
                queryClient.setQueryData<WalletDashboard | undefined>(
                  ['wallet-dashboard'],
                  (previous) => {
                    if (!previous) return previous
                    return {
                      ...previous,
                      binding: {
                        ...previous.binding,
                        isPaymentMethodBound: true,
                      },
                      paymentMethods: previous.paymentMethods.map((method) =>
                        method.id === 'wechat-pay'
                          ? { ...method, isBound: true, isSelected: true }
                          : method
                      ),
                    }
                  }
                )
                setBindingDialogOpen(false)
              }}
            >
              已完成绑定，刷新状态
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* 客服入口（浮动按钮 + 悬停提示图片） */}
      <div className='fixed bottom-[104px] right-6 z-50 group'>
        <button
          type='button'
          aria-label='联系客服'
          onClick={() => {
            setShowServiceTip((prev) => !prev)
          }}
          className='flex h-[46px] w-[46px] items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-primary/5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'
        >
          <svg viewBox='0 0 1024 1024' className='h-6 w-6 fill-current text-muted-foreground transition-colors group-hover:text-primary'>
            <path d='M966.5 345.4c-30.3-91.7-89.1-173.9-166.6-232.4-83.5-63-183-96.3-287.9-96.3S307.6 50 224.1 113C146.6 171.4 87.8 253.6 57.5 345.4c-34 13-57.5 46-57.5 83.1v133.6c0 41.7 29.6 78.3 70.4 87 6.2 1.3 12.4 2 18.6 2 49.1 0 89-39.9 89-89V428.5c0-43.2-31-79.3-71.9-87.3 63.3-166.2 226-280 405.8-280s342.5 113.7 405.8 280c-40.9 8-71.9 44.1-71.9 87.3v133.6c0 39 25.2 72.1 60.2 84.1C847.8 772.1 732.3 863 596.3 889.8c-11.8-35.5-45.1-60.7-84.3-60.7-49.1 0-89 39.9-89 89s39.9 89 89 89c43.5 0 79.7-31.4 87.5-72.7 158.1-29.2 291.6-136.8 353.9-285.5h0.2c40.8-8.8 70.4-45.4 70.4-87V428.5c0-37.1-23.5-70.1-57.5-83.1z m-832.9 83.1v133.6c0 24.6-20 44.5-44.5 44.5-3.1 0-6.2-0.3-9.3-1-20.4-4.4-35.2-22.7-35.2-43.5V428.5c0-20.8 14.8-39.1 35.2-43.5 3.1-0.7 6.2-1 9.3-1 24.5 0 44.5 20 44.5 44.5zM512 962.8c-24.5 0-44.5-20-44.5-44.5s20-44.5 44.5-44.5c23.9 0 43.4 18.8 44.4 42.7 0 0.6 0.1 1.1 0.1 1.8 0 24.5-20 44.5-44.5 44.5z m467.5-400.7c0 20.8-14.8 39.1-35.2 43.5-2.2 0.5-4.6 0.8-7.5 0.9-0.6 0-1.2 0.1-1.8 0.1-24.5 0-44.5-20-44.5-44.5V428.5c0-24.5 20-44.5 44.5-44.5 3.1 0 6.2 0.3 9.3 1 20.4 4.4 35.2 22.7 35.2 43.5v133.6z' />
            <path d='M682.7 656.6c9.2-8.2 9.9-22.3 1.7-31.4-8.2-9.2-22.3-9.9-31.4-1.7-149.1 133.5-275.2 6.9-280.7 1.2-8.5-8.9-22.6-9.2-31.5-0.7-8.9 8.5-9.2 22.6-0.7 31.5 1.1 1.1 72.2 73.6 173.3 73.6 50.6-0.1 108.7-18.3 169.3-72.5z' />
          </svg>
        </button>
        {/* 悬停展示的提示图片 */}
        <img
          src={'https://dnu-cdn.xpertiise.com/common/674ad0d6-cee5-4349-b98a-782f8f63470f.jpeg'}
          alt='客服说明'
          onClick={() => setShowServiceTip(false)}
          className={cn(
            'absolute bottom-0 right-16 mb-1 w-[60px] max-w-none rounded bg-white shadow-xl transition-all duration-300 origin-bottom-right',
            showServiceTip
              ? 'pointer-events-auto cursor-pointer opacity-100 translate-y-0 scale-[4]'
              : 'pointer-events-none opacity-0 translate-y-2 scale-100 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-[4]',
          )}
        />
      </div>
    </>
  )
}
