import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getDisbursementRecords,
  type DisbursementRecord,
  type DisbursementRecordsResponse,
} from '@/features/wallet/api'
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/features/wallet/constants'
import { formatCurrency, formatDate } from '@/features/wallet/utils'
import { Badge } from '@/components/ui/badge'

interface Props {
  isActive: boolean
}

function renderDisbursementStatusBadge(status: number) {
  switch (status) {
    case 0:
      return <Badge variant='secondary'>待发放</Badge>
    case 10:
      return <Badge variant='default'>已发放</Badge>
    case 20:
      return <Badge variant='destructive'>发放失败</Badge>
    case 30:
      return <Badge variant='outline'>已取消</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

export default function PaymentRecordsTab({ isActive }: Props) {
  const [paymentPageSize, setPaymentPageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0])
  const [paymentPage, setPaymentPage] = useState(1)
  const [disbursementStatus, setDisbursementStatus] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [batchId, setBatchId] = useState<string>('')

  const paymentLimit = Math.min(paymentPageSize, 100)
  const paymentSkip = Math.max(0, (paymentPage - 1) * paymentLimit)
  const disbursementParams = useMemo(() => {
    const params: {
      skip: number
      limit: number
      disbursement_status?: number
      payment_method?: number
      batch_id?: string
    } = { skip: paymentSkip, limit: paymentLimit }
    const ds = Number(disbursementStatus)
    if (!Number.isNaN(ds) && disbursementStatus !== 'all') params.disbursement_status = ds
    const pm = Number(paymentMethodFilter)
    if (!Number.isNaN(pm) && paymentMethodFilter !== 'all') params.payment_method = pm
    if (batchId.trim()) params.batch_id = batchId.trim()
    return params
  }, [paymentSkip, paymentLimit, disbursementStatus, paymentMethodFilter, batchId])

  const { data: disbursementData, isLoading: isPaymentLoading } = useQuery<DisbursementRecordsResponse>({
    queryKey: ['disbursement-records', disbursementParams],
    queryFn: async () => getDisbursementRecords(disbursementParams),
    enabled: isActive,
  })
  const disbursementItems: DisbursementRecord[] = disbursementData?.data ?? []
  const disbursementCount = disbursementData?.count ?? 0
  const paymentTotalPages = Math.max(1, Math.ceil(disbursementCount / paymentLimit))
  const currentPaymentPage = Math.min(paymentPage, paymentTotalPages)

  const handlePaymentPageSizeChange = (value: string) => {
    const size = Number(value) as PageSize
    setPaymentPageSize(size)
    setPaymentPage(1)
  }
  const handlePaymentPrev = () => setPaymentPage((prev) => Math.max(1, prev - 1))
  const handlePaymentNext = () => setPaymentPage((prev) => Math.min(paymentTotalPages, prev + 1))

  return (
    <Card className='overflow-hidden border border-gray-200'>
      <CardContent className='flex flex-col gap-3 p-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>支出状态</span>
            <Select
              value={disbursementStatus}
              onValueChange={(v) => {
                setDisbursementStatus(v)
                setPaymentPage(1)
              }}
            >
              <SelectTrigger className='h-9 w-[160px]'>
                <SelectValue placeholder='全部' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='0'>待发放</SelectItem>
                <SelectItem value='10'>已发放</SelectItem>
                <SelectItem value='20'>发放失败</SelectItem>
                <SelectItem value='30'>已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>支付方式</span>
            <Select
              value={paymentMethodFilter}
              onValueChange={(v) => {
                setPaymentMethodFilter(v)
                setPaymentPage(1)
              }}
            >
              <SelectTrigger className='h-9 w-[160px]'>
                <SelectValue placeholder='全部' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='0'>线下支付</SelectItem>
                <SelectItem value='1'>微信支付</SelectItem>
                <SelectItem value='2'>银行支付</SelectItem>
                <SelectItem value='3'>支付宝支付</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-2'>
            {/* 批次ID过滤项按需求隐藏 */}
          </div>
          {(disbursementStatus !== 'all' || paymentMethodFilter !== 'all' || batchId.trim()) && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setDisbursementStatus('all')
                setPaymentMethodFilter('all')
                setBatchId('')
                setPaymentPage(1)
              }}
            >
              清空筛选
            </Button>
          )}
        </div>
      </CardContent>
      <div className='w-full overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>付款信息</TableHead>
              <TableHead>金额(税前)</TableHead>
              <TableHead>代扣税</TableHead>
              <TableHead>实发</TableHead>
              <TableHead>渠道</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPaymentLoading ? (
              <TableRow>
                <TableCell colSpan={6} className='text-muted-foreground h-24 text-center'>
                  数据加载中…
                </TableCell>
              </TableRow>
            ) : disbursementItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-muted-foreground h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              disbursementItems.map((item) => {
                const channel =
                  item.payment_method === 1
                    ? '微信支付'
                    : item.payment_method === 2
                    ? '银行支付'
                    : item.payment_method === 3
                    ? '支付宝支付'
                    : '线下支付'
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className='space-y-1'>
                        <p>{formatDate(item.payment_date)}</p>
                        <p className='text-muted-foreground text-xs'>
                          {item.payment_id}
                          {item.split_total > 1 ? ` · 拆分 ${item.split_index}/${item.split_total}` : ''}
                        </p>
                        {item.batch_id && <p className='text-muted-foreground text-xs'>批次 {item.batch_id}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.total_amount)}</TableCell>
                    <TableCell>{formatCurrency(item.tax_amount)}</TableCell>
                    <TableCell className='font-semibold text-emerald-600'>
                      {formatCurrency(item.actual_amount)}
                    </TableCell>
                    <TableCell>{channel}</TableCell>
                    <TableCell>{renderDisbursementStatusBadge(item.disbursement_status)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className='border-border flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between'>
        <p className='text-muted-foreground text-sm'>共 {disbursementCount} 条记录</p>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>每页显示</span>
            <Select value={String(paymentPageSize)} onValueChange={handlePaymentPageSizeChange}>
              <SelectTrigger className='h-9 w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side='top' align='end'>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    每页 {option} 条
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant='outline' size='sm' onClick={handlePaymentPrev} disabled={currentPaymentPage === 1}>
            上一页
          </Button>
          <span className='text-muted-foreground text-sm'>
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
    </Card>
  )
}


