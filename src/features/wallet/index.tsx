import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import TitleBar from '@/components/title-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import officialQr from '@/assets/images/home-official.jfif'
import experienceQr from '@/assets/images/home-experience.jfif'
import { detectRuntimeEnvSync } from '@/lib/env'

type IncomeType = '任务收入' | '满单奖'
type IncomeStatus = 'pending' | 'issued'
type PaymentStatus = 'success' | 'failed'

interface WalletOverview {
  grossTaskIncome: number
  currentMonthIncome: number
  pendingPreTax: number
  estimatedPaymentDate: string
}

interface BindingInfo {
  isPaymentMethodBound: boolean
  qrCodeDescription?: string
}

interface IncomeRecord {
  id: string
  project: string
  incomeType: IncomeType
  taskId: string
  workDurationSeconds: number
  hourlyRate: number
  unitIncome: number
  totalAmount: number
  status: IncomeStatus
  paymentAt?: string
}

interface PaymentRecord {
  id: string
  paymentDate: string
  grossAmount: number
  withholdingAmount: number
  netAmount: number
  channel: '微信支付'
  status: PaymentStatus
  remark?: string
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
  incomeRecords: IncomeRecord[]
  paymentRecords: PaymentRecord[]
  paymentMethods: PaymentMethod[]
  realNameVerification: RealNameVerification
}

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200] as const
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

const realNameFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, '请输入正确的真实姓名')
    .max(30, '真实姓名长度不能超过30个字符'),
  idNumber: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/, '请输入有效的18位身份证号'),
})

type RealNameFormValues = z.infer<typeof realNameFormSchema>

const createMockIncomeRecords = (): IncomeRecord[] => {
  return Array.from({ length: 120 }, (_, index) => {
    const baseHourlyRate = 75 + (index % 4) * 8
    const workDurationSeconds = 5400 + (index % 5) * 900
    const unitIncome = Number((baseHourlyRate * 1.2).toFixed(2))
    const totalAmount = Number((unitIncome * ((index % 3) + 1)).toFixed(2))
    const status: IncomeStatus = index % 4 === 0 ? 'pending' : 'issued'
    const paymentAt =
      status === 'issued' ? new Date(Date.UTC(2025, 7, 15 + index)).toISOString() : undefined

    return {
      id: `INC-${202500 + index}`,
      project: `千识数据标注项目 ${index + 1}`,
      incomeType: index % 6 === 0 ? '满单奖' : '任务收入',
      taskId: `TASK-${1000 + index}`,
      workDurationSeconds,
      hourlyRate: baseHourlyRate,
      unitIncome,
      totalAmount,
      status,
      paymentAt,
    }
  })
}

const createMockPaymentRecords = (): PaymentRecord[] => {
  return Array.from({ length: 24 }, (_, index) => {
    const grossAmount = Number((620 + index * 18).toFixed(2))
    const withholdingAmount = Number((65 + (index % 4) * 5).toFixed(2))
    const netAmount = Number((grossAmount - withholdingAmount).toFixed(2))
    const status: PaymentStatus = index % 5 === 0 ? 'failed' : 'success'

    return {
      id: `PAY-${202500 + index}`,
      paymentDate: new Date(Date.UTC(2025, 6, 1 + index)).toISOString(),
      grossAmount,
      withholdingAmount,
      netAmount,
      channel: '微信支付',
      status,
      remark: status === 'failed' ? '账号风控，请重新绑定后重试' : undefined,
    }
  })
}

const fetchWalletDashboard = async (): Promise<WalletDashboard> => {
  const isBound = false

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        overview: {
          grossTaskIncome: 12860.58,
          currentMonthIncome: 5320.75,
          pendingPreTax: 1820.4,
          estimatedPaymentDate: '2025-11-08',
        },
        binding: {
          isPaymentMethodBound: isBound,
          qrCodeDescription: '使用微信扫描二维码即可绑定千识任务收入收款账户。',
        },
        incomeRecords: createMockIncomeRecords(),
        paymentRecords: createMockPaymentRecords(),
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

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) {
    return '-'
  }

  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatDate = (value?: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}/${month}/${day}`
}

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null) {
    return '-'
  }

  if (seconds <= 0) {
    return '0秒'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const parts: string[] = []

  if (hours) {
    parts.push(`${hours}小时`)
  }

  if (minutes) {
    parts.push(`${minutes}分钟`)
  }

  if (secs) {
    parts.push(`${secs}秒`)
  }

  return parts.length > 0 ? parts.join('') : '0秒'
}

const renderIncomeStatusBadge = (status: IncomeStatus) => {
  switch (status) {
    case 'pending':
      return <Badge variant='secondary'>待发放</Badge>
    case 'issued':
      return <Badge variant='default'>已发放</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

const renderPaymentStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'failed':
      return <Badge variant='destructive'>不成功</Badge>
    case 'success':
      return <Badge variant='default'>成功</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('income')
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [incomePageSize, setIncomePageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0])
  const [incomePage, setIncomePage] = useState(1)
  const [paymentPageSize, setPaymentPageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0])
  const [paymentPage, setPaymentPage] = useState(1)

  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-dashboard'],
    queryFn: fetchWalletDashboard,
  })

  const qrCodeImageSrc = import.meta.env.PROD ? officialQr : experienceQr

  const realNameForm = useForm<RealNameFormValues>({
    resolver: zodResolver(realNameFormSchema),
    defaultValues: {
      fullName: '',
      idNumber: '',
    },
  })

  const overview = data?.overview
  const binding = data?.binding
  const realNameVerification = data?.realNameVerification
  const incomeRecords = useMemo(() => data?.incomeRecords ?? [], [data?.incomeRecords])
  const paymentRecords = useMemo(() => data?.paymentRecords ?? [], [data?.paymentRecords])
  const paymentMethods = useMemo(() => data?.paymentMethods ?? [], [data?.paymentMethods])

  const incomeRecordCount = incomeRecords.length
  const incomeTotalPages = Math.max(1, Math.ceil(incomeRecordCount / incomePageSize))
  const currentIncomePage = Math.min(incomePage, incomeTotalPages)
  const paginatedIncomeRecords = useMemo(() => {
    const start = (currentIncomePage - 1) * incomePageSize
    return incomeRecords.slice(start, start + incomePageSize)
  }, [incomeRecords, currentIncomePage, incomePageSize])

  const paymentRecordCount = paymentRecords.length
  const paymentTotalPages = Math.max(1, Math.ceil(paymentRecordCount / paymentPageSize))
  const currentPaymentPage = Math.min(paymentPage, paymentTotalPages)
  const paginatedPaymentRecords = useMemo(() => {
    const start = (currentPaymentPage - 1) * paymentPageSize
    return paymentRecords.slice(start, start + paymentPageSize)
  }, [paymentRecords, currentPaymentPage, paymentPageSize])

  const handleIncomePageSizeChange = (value: string) => {
    const size = Number(value) as PageSize
    setIncomePageSize(size)
    setIncomePage(1)
  }

  const handlePaymentPageSizeChange = (value: string) => {
    const size = Number(value) as PageSize
    setPaymentPageSize(size)
    setPaymentPage(1)
  }

  const handleIncomePrev = () => {
    setIncomePage((prev) => Math.max(1, prev - 1))
  }

  const handleIncomeNext = () => {
    setIncomePage((prev) => Math.min(incomeTotalPages, prev + 1))
  }

  const handlePaymentPrev = () => {
    setPaymentPage((prev) => Math.max(1, prev - 1))
  }

  const handlePaymentNext = () => {
    setPaymentPage((prev) => Math.min(paymentTotalPages, prev + 1))
  }

  const handleRealNameSubmit = async (values: RealNameFormValues) => {
    const normalizedFullName = values.fullName.trim()
    const normalizedId = values.idNumber.replace(/\s+/g, '').toUpperCase()

    await new Promise((resolve) => setTimeout(resolve, 800))

    queryClient.setQueryData<WalletDashboard | undefined>(['wallet-dashboard'], (previous) => {
      if (!previous) {
        return previous
      }

      return {
        ...previous,
        realNameVerification: {
          isVerified: true,
          fullName: normalizedFullName,
          idNumber: normalizedId,
        },
      }
    })

    realNameForm.reset({ fullName: normalizedFullName, idNumber: normalizedId })
  }

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

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='md:mx-16 py-0 overflow-y-auto'>
        <TitleBar title='钱包' back separator />

        <div className='flex flex-col gap-4 sm:flex-row sm:items-stretch mb-6'>
          <div className='flex-1 rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A] bg-card'>
            <div className='space-y-2 p-4 md:p-6'>
              <h3 className='text-sm font-medium text-muted-foreground'>任务收入（税前）</h3>
              <p className='text-3xl font-semibold text-foreground'>
                {isLoading ? '加载中…' : formatCurrency(overview?.grossTaskIncome)}
              </p>
                <p className='text-sm text-muted-foreground'>
                {isLoading
                  ? '加载中…'
                  : overview
                  ? `${formatCurrency(overview.currentMonthIncome)} 本月收入`
                  : '-'}
                </p>
              </div>
          </div>
          
          <div className='flex-1 rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A] bg-card'>
            <div className='space-y-2 p-4 md:p-6'>
              <h3 className='text-sm font-medium text-muted-foreground'>待发放（税前）</h3>
              <p className='text-3xl font-semibold text-foreground'>
                {isLoading ? '加载中…' : formatCurrency(overview?.pendingPreTax)}
              </p>
                <p className='text-sm text-muted-foreground'>
                {isLoading
                  ? '加载中…'
                  : overview
                  ? `预计付款日期 ${formatDate(overview.estimatedPaymentDate)}`
                  : '预计付款日期 -'}
              </p>
            </div>
          </div>
        </div>

        <div className='mb-6 rounded-xl border border-[#4E02E40D] shadow-[0_0_4px_0_#0000001A] bg-card'>
          <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
            {isLoading ? (
              <p className='text-sm text-muted-foreground'>正在加载付款方式绑定信息…</p>
            ) : binding?.isPaymentMethodBound ? (
              <div className='space-y-1 text-sm text-muted-foreground'>
                <p>通过的题目【每天晚上21：00】打款，可能会有2个小时误差</p>
                <p>支付失败的，隔天会与当天所有未支付的款项合并后重试</p>
              </div>
            ) : (
              <div className='space-y-1 text-sm text-muted-foreground'>
                <p>您还没绑定付款方式，为顺利支付，请先绑定</p>
              </div>
            )}

            {!isLoading && !binding?.isPaymentMethodBound && (
              <Button size='sm' onClick={handleBindClick}>
                绑定
              </Button>
            )}
          </div>
        </div>

        <div className='space-y-4'>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground'>
              <TabsTrigger value='income'>收入</TabsTrigger>
              <TabsTrigger value='payment'>付款记录</TabsTrigger>
              <TabsTrigger value='method'>付款方式</TabsTrigger>
              <TabsTrigger value='realname'>实名认证</TabsTrigger>
            </TabsList>

            <TabsContent value='income' className='space-y-4'>
              <Card className='border border-gray-200'>
                <div className='w-full overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>项目</TableHead>
                        <TableHead>收入类型</TableHead>
                          <TableHead>任务ID</TableHead>
                        <TableHead>工作时长</TableHead>
                        <TableHead>时薪</TableHead>
                          <TableHead>每条收入</TableHead>
                          <TableHead>总金额(税前)</TableHead>
                        <TableHead>状态</TableHead>
                          <TableHead>付款时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={10} className='h-24 text-center text-muted-foreground'>
                              数据加载中…
                            </TableCell>
                          </TableRow>
                        ) : incomeRecordCount === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className='h-24 text-center text-muted-foreground'>
                            暂无数据
                          </TableCell>
                        </TableRow>
                      ) : (
                          paginatedIncomeRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className='font-medium'>{record.id}</TableCell>
                              <TableCell className='max-w-[220px] truncate'>{record.project}</TableCell>
                            <TableCell>{record.incomeType}</TableCell>
                              <TableCell>{record.taskId}</TableCell>
                              <TableCell>{formatDuration(record.workDurationSeconds)}</TableCell>
                              <TableCell>{`${formatCurrency(record.hourlyRate)} / 小时`}</TableCell>
                              <TableCell>{formatCurrency(record.unitIncome)}</TableCell>
                              <TableCell className='font-semibold text-emerald-600'>
                                {formatCurrency(record.totalAmount)}
                              </TableCell>
                              <TableCell>{renderIncomeStatusBadge(record.status)}</TableCell>
                              <TableCell>{formatDateTime(record.paymentAt)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className='flex flex-col gap-3 border-t border-border p-4 md:flex-row md:items-center md:justify-between'>
                    <p className='text-sm text-muted-foreground'>共 {incomeRecordCount} 条记录</p>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-muted-foreground'>每页显示</span>
                        <Select value={String(incomePageSize)} onValueChange={handleIncomePageSizeChange}>
                          <SelectTrigger className='w-[120px]'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)}>
                                每页 {option} 条
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Button variant='outline' size='sm' onClick={handleIncomePrev} disabled={currentIncomePage === 1}>
                          上一页
                        </Button>
                        <span className='text-sm text-muted-foreground'>
                          第 {currentIncomePage} 页 / 共 {incomeTotalPages} 页
                        </span>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleIncomeNext}
                          disabled={currentIncomePage === incomeTotalPages}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value='payment' className='space-y-4'>
              <Card className='border border-gray-200 overflow-hidden'>
                <div className='w-full overflow-x-auto'>
                  <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>付款日期</TableHead>
                          <TableHead>金额(税前)</TableHead>
                          <TableHead>代扣款</TableHead>
                          <TableHead>实发</TableHead>
                          <TableHead>渠道</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                              数据加载中…
                            </TableCell>
                          </TableRow>
                        ) : paymentRecordCount === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                              暂无数据
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedPaymentRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{formatDate(record.paymentDate)}</TableCell>
                              <TableCell>{formatCurrency(record.grossAmount)}</TableCell>
                              <TableCell>{formatCurrency(record.withholdingAmount)}</TableCell>
                              <TableCell className='font-semibold text-emerald-600'>
                                {formatCurrency(record.netAmount)}
                              </TableCell>
                              <TableCell>{record.channel}</TableCell>
                              <TableCell>
                                <div className='space-y-1'>
                                  {renderPaymentStatusBadge(record.status)}
                                  {record.status === 'failed' && record.remark && (
                                    <p className='text-xs text-muted-foreground'>{record.remark}</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                </div>

                <div className='flex flex-col gap-3 border-t border-border p-4 md:flex-row md:items-center md:justify-between'>
                    <p className='text-sm text-muted-foreground'>共 {paymentRecordCount} 条记录</p>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-muted-foreground'>每页显示</span>
                        <Select value={String(paymentPageSize)} onValueChange={handlePaymentPageSizeChange}>
                          <SelectTrigger className='w-[120px]'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)}>
                                每页 {option} 条
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Button variant='outline' size='sm' onClick={handlePaymentPrev} disabled={currentPaymentPage === 1}>
                          上一页
                        </Button>
                        <span className='text-sm text-muted-foreground'>
                          第 {currentPaymentPage} 页 / 共 {paymentTotalPages} 页
                        </span>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handlePaymentNext}
                          disabled={currentPaymentPage === paymentTotalPages}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value='method' className='space-y-4'>
              <Card className='border border-gray-200'>
                <CardContent className='space-y-6 p-6'>
                  <p className='text-sm text-muted-foreground'>请确保您千识的注册手机号与支付方式绑定的手机号一致。</p>

                  <div className='space-y-4'>
                    {isLoading && (
                      <p className='text-sm text-muted-foreground'>正在加载支付方式…</p>
                    )}

                    {!isLoading && paymentMethods.length === 0 && (
                      <p className='text-sm text-muted-foreground'>暂无可用支付方式</p>
                    )}

                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className='flex flex-col gap-3 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div className='space-y-1'>
                          <div className='flex items-center gap-3'>
                            <p className='text-base font-medium'>{method.name}</p>
                            {method.isSelected && <Badge variant='default'>默认</Badge>}
                            {method.isBound && <Badge variant='secondary'>已绑定</Badge>}
                          </div>
                          {method.description && (
                            <p className='text-sm text-muted-foreground'>{method.description}</p>
                          )}
                        </div>

                        {!method.isBound && (
                          <Button size='sm' onClick={handleBindClick}>
                            绑定
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='realname' className='space-y-4'>
              <Card className='border border-gray-200'>
                <CardContent className='space-y-6 p-6'>
                  <div className='space-y-1 text-sm text-muted-foreground'>
                    <p>实名认证为银行合规打款要求的必须流程，实名认证完成后无需再进行</p>
                    <p>请确保您的实名信息与绑定的支付方式所使用的实名信息一致</p>
                  </div>

                  {isLoading ? (
                    <p className='text-sm text-muted-foreground'>正在加载实名认证信息…</p>
                  ) : realNameVerification?.isVerified ? (
                    <div className='space-y-3 rounded-lg border border-dashed border-border p-4'>
                      <div>
                        <p className='text-sm text-muted-foreground'>真实姓名</p>
                        <p className='text-base font-medium text-foreground'>{realNameVerification.fullName}</p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>身份证号</p>
                        <p className='font-mono text-base tracking-wide text-foreground'>{realNameVerification.idNumber}</p>
                      </div>
                    </div>
                  ) : (
                    <Form {...realNameForm}>
                      <form onSubmit={realNameForm.handleSubmit(handleRealNameSubmit)} className='space-y-4'>
                        <FormField
                          control={realNameForm.control}
                          name='fullName'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>真实姓名</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder='请输入真实姓名'
                                  autoComplete='name'
                                  maxLength={30}
                                  disabled={realNameForm.formState.isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={realNameForm.control}
                          name='idNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>身份证号</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder='请输入18位身份证号'
                                  autoComplete='off'
                                  inputMode='text'
                                  maxLength={18}
                                  disabled={realNameForm.formState.isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type='submit'
                          className='w-full sm:w-auto'
                          disabled={realNameForm.formState.isSubmitting}
                        >
                          {realNameForm.formState.isSubmitting ? '提交中…' : '提交'}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
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
              className='h-48 w-48 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 object-cover'
            />
            <p className='text-xs text-muted-foreground text-center'>请使用微信扫一扫功能完成绑定。</p>
            {binding?.qrCodeDescription && (
              <p className='text-xs text-muted-foreground text-center'>{binding.qrCodeDescription}</p>
            )}
            <Button
              size='sm'
              onClick={async () => {
                await new Promise((resolve) => setTimeout(resolve, 300))
                queryClient.setQueryData<WalletDashboard | undefined>(['wallet-dashboard'], (previous) => {
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
                        : method,
                    ),
                  }
                })
                setBindingDialogOpen(false)
              }}
            >
              已完成绑定，刷新状态
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
