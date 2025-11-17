import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconInfoCircle } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getReferralList, type ReferralListItem, type ReferralListResponse } from '@/features/referral/api'
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/features/referral/constants'
import { formatCurrency, formatDateTime } from '@/features/wallet/utils'

interface Props {
  isActive: boolean
}

function renderPaymentStatusBadge(status: number) {
  switch (status) {
    case 0:
      return <Badge variant='secondary'>待发放</Badge>
    case 10:
      return <Badge variant='default'>已发放</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

export default function ReferralListTab({ isActive }: Props) {
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0])
  const [page, setPage] = useState(1)

  const limit = Math.min(pageSize, 200)
  const skip = Math.max(0, (page - 1) * limit)
  
  const queryParams = useMemo(() => {
    return { skip, limit }
  }, [skip, limit])

  const { data, isLoading } = useQuery<ReferralListResponse>({
    queryKey: ['referral-list', queryParams],
    queryFn: async () => getReferralList(queryParams),
    enabled: isActive,
  })

  const items: ReferralListItem[] = data?.data ?? []
  const count = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / limit))
  const currentPage = Math.min(page, totalPages)

  const handlePageSizeChange = (value: string) => {
    const size = Number(value) as PageSize
    setPageSize(size)
    setPage(1)
  }

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1))
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1))

  return (
    <Card className='overflow-hidden border border-gray-200'>
      <div className='w-full overflow-x-auto px-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>被推荐人</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>最近登录</TableHead>
              <TableHead>
                <div className='flex items-center gap-1'>
                  <span>参与中的内推项目</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconInfoCircle className='h-4 w-4 text-muted-foreground' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>参与中，但还没完成任务的项目</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead>
                <div className='flex items-center gap-1'>
                  <span>完成任务</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconInfoCircle className='h-4 w-4 text-muted-foreground' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>触发内推奖励的活动内容</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead>内推收入（税前）</TableHead>
              <TableHead>支付状态</TableHead>
              <TableHead>支付时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className='text-muted-foreground h-24 text-center'>
                  数据加载中…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='text-muted-foreground h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.referee_name}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>
                    {item.last_login_time ? formatDateTime(item.last_login_time) : '-'}
                  </TableCell>
                  <TableCell>{item.active_projects}</TableCell>
                  <TableCell>{item.completed_tasks}</TableCell>
                  <TableCell className='font-semibold text-emerald-600'>
                    {formatCurrency(item.referral_income)}
                  </TableCell>
                  <TableCell>{renderPaymentStatusBadge(item.payment_status)}</TableCell>
                  <TableCell>
                    {item.payment_time ? formatDateTime(item.payment_time) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className='border-border flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between'>
        <p className='text-muted-foreground text-sm'>共 {count} 条记录</p>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>每页显示</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
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
          <Button variant='outline' size='sm' onClick={handlePrev} disabled={currentPage === 1}>
            上一页
          </Button>
          <span className='text-muted-foreground text-sm'>
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      </div>
    </Card>
  )
}

