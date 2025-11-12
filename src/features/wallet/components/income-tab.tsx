import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getExpenseDetails, type ExpenseDetail, type ExpenseDetailsResponse } from '@/features/wallet/api'
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/features/wallet/constants'
import { formatCurrency, formatHours } from '@/features/wallet/utils'
import { Badge } from '@/components/ui/badge'

interface Props {
  isActive: boolean
}

export default function IncomeTab({ isActive }: Props) {
  const [incomePageSize, setIncomePageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0])
  const [incomePage, setIncomePage] = useState(1)
  const [projectId, setProjectId] = useState<string>('') // 筛选：项目ID
  const [expenseStatus, setExpenseStatus] = useState<string>('all') // 费用状态
  const [paymentStatus, setPaymentStatus] = useState<string>('all') // 付款状态

  const incomeLimit = Math.min(incomePageSize, 100)
  const incomeSkip = Math.max(0, (incomePage - 1) * incomeLimit)
  const expenseParams = useMemo(() => {
    const params: {
      skip: number
      limit: number
      project_id?: number
      expense_status?: number | number[]
      payment_status?: number
    } = { skip: incomeSkip, limit: incomeLimit }
    const pid = Number(projectId.trim())
    if (!Number.isNaN(pid) && projectId.trim() !== '') params.project_id = pid
    // 默认仅展示已批准(10)与已支付(20)
    if (expenseStatus === 'all') {
      params.expense_status = [10, 20]
    } else {
      const es = Number(expenseStatus)
      if (!Number.isNaN(es)) params.expense_status = es
    }
    const ps = Number(paymentStatus)
    if (!Number.isNaN(ps) && paymentStatus !== 'all') params.payment_status = ps
    return params
  }, [incomeSkip, incomeLimit, projectId, expenseStatus, paymentStatus])

  const { data: expenseData, isLoading: isIncomeLoading } = useQuery<ExpenseDetailsResponse>({
    queryKey: ['expense-details', expenseParams],
    queryFn: async (): Promise<ExpenseDetailsResponse> => getExpenseDetails(expenseParams),
    enabled: isActive,
  })
  const expenseItems: ExpenseDetail[] = expenseData?.data ?? []
  const expenseCount = expenseData?.count ?? 0
  const incomeTotalPages = Math.max(1, Math.ceil(expenseCount / incomeLimit))
  const currentIncomePage = Math.min(incomePage, incomeTotalPages)

  const handleIncomePageSizeChange = (value: string) => {
    const size = Number(value) as PageSize
    setIncomePageSize(size)
    setIncomePage(1)
  }
  const handleIncomePrev = () => setIncomePage((prev) => Math.max(1, prev - 1))
  const handleIncomeNext = () => setIncomePage((prev) => Math.min(incomeTotalPages, prev + 1))

  const renderExpenseStatusBadge = (status?: number) => {
    switch (status) {
      case 0:
        return <Badge variant='secondary'>待处理</Badge>
      case 10:
        return <Badge variant='default'>已批准</Badge>
      case 20:
        return <Badge variant='default'>已支付</Badge>
      case 30:
        return <Badge variant='destructive'>已拒绝</Badge>
      default:
        return <Badge variant='outline'>{status ?? '-'}</Badge>
    }
  }

  return (
    <Card className='border border-gray-200'>
      <CardContent className='flex flex-col gap-3 p-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>费用状态</span>
            <Select
              value={expenseStatus}
              onValueChange={(v) => {
                setExpenseStatus(v)
                setIncomePage(1)
              }}
            >
              <SelectTrigger className='h-9 w-[160px]'>
                <SelectValue placeholder='全部' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='10'>已批准</SelectItem>
                <SelectItem value='20'>已支付</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>付款状态</span>
            <Select
              value={paymentStatus}
              onValueChange={(v) => {
                setPaymentStatus(v)
                setIncomePage(1)
              }}
            >
              <SelectTrigger className='h-9 w-[160px]'>
                <SelectValue placeholder='全部' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='0'>未付款</SelectItem>
                <SelectItem value='10'>已付款</SelectItem>
                <SelectItem value='20'>处理中</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(projectId || expenseStatus !== 'all' || paymentStatus !== 'all') && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setProjectId('')
                setExpenseStatus('all')
                setPaymentStatus('all')
                setIncomePage(1)
              }}
            >
              清空筛选
            </Button>
          )}
        </div>
      </CardContent>
      <div className='w-full overflow-x-auto px-4'>
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
            <TableHead>费用状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isIncomeLoading ? (
              <TableRow>
                <TableCell colSpan={9} className='text-muted-foreground h-24 text-center'>
                  数据加载中…
                </TableCell>
              </TableRow>
            ) : expenseItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='text-muted-foreground h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              expenseItems.map((item) => {
                const showHourly = (item.payable_hours ?? 0) > 0
                return (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>{item.id}</TableCell>
                    <TableCell className='max-w-[220px] truncate'>{item.project_name}</TableCell>
                    <TableCell>{item.payment_type ?? '任务收入'}</TableCell>
                    <TableCell>{item.task_id ?? '-'}</TableCell>
                    <TableCell>{formatHours(item.payable_hours)}</TableCell>
                    <TableCell>{showHourly ? `${formatCurrency(item.actual_unit_price)} / 小时` : '-'}</TableCell>
                    <TableCell>{showHourly ? '-' : formatCurrency(item.actual_unit_price)}</TableCell>
                    <TableCell className='font-semibold text-emerald-600'>
                      {formatCurrency(item.apply_amount)}
                    </TableCell>
                    <TableCell>{renderExpenseStatusBadge(item.expense_status)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className='border-border flex flex-col gap-3 border-top border-t p-4 md:flex-row md:items-center md:justify-between'>
        <p className='text-muted-foreground text-sm'>共 {expenseCount} 条记录</p>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>每页显示</span>
            <Select value={String(incomePageSize)} onValueChange={handleIncomePageSizeChange}>
              <SelectTrigger className='h-9 w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side='top' align='end'>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} 条
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant='outline' size='sm' onClick={handleIncomePrev} disabled={currentIncomePage === 1}>
            上一页
          </Button>
          <span className='text-muted-foreground text-sm'>
            第 {currentIncomePage} 页 / 共 {incomeTotalPages} 页
          </span>
          <Button variant='outline' size='sm' onClick={handleIncomeNext} disabled={currentIncomePage === incomeTotalPages}>
            下一页
          </Button>
        </div>
      </div>
    </Card>
  )
}


