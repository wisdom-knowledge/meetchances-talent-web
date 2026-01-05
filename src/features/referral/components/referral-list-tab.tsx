import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getReferralList, type ReferralListItem, type ReferralListResponse } from '@/features/referral/api'
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/features/referral/constants'
import { formatCurrency, formatDateTime } from '@/features/wallet/utils'

interface Props {
  isActive: boolean
}

function renderReferralStatusBadge(status: number) {
  switch (status) {
    case 0:
      return <Badge variant='secondary'>待完成任务</Badge>
    case 10:
      return <Badge variant='outline'>已批准</Badge>
    case 20:
      return <Badge variant='default'>已结算</Badge>
    case 30:
      return <Badge variant='destructive'>已拒绝</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

export default function ReferralListTab({ isActive }: Props) {
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0])
  const [page, setPage] = useState(1)

  const limit = Math.min(pageSize, 200)
  const skip = Math.max(0, (page - 1) * limit)

  const { data, isLoading } = useQuery<ReferralListResponse>({
    queryKey: ['referral-list', skip, limit],
    queryFn: async () => getReferralList({ skip, limit }),
    enabled: isActive,
  })

  const items: ReferralListItem[] = data?.items ?? []
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
              <TableHead>内推奖状态</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>已完成的内推活动</TableHead>
              <TableHead>内推收入（税前）</TableHead>
              <TableHead>奖励时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className='text-muted-foreground h-24 text-center'>
                  数据加载中…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-muted-foreground h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium'>{item.id}</TableCell>
                  <TableCell>{item.referred_name}</TableCell>
                  <TableCell>{renderReferralStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.referred_phone}</TableCell>
                  <TableCell className='max-w-[300px] whitespace-pre-line'>
                    {item.completed_activities || '-'}
                  </TableCell>
                  <TableCell className='font-semibold text-emerald-600'>
                    {item.reward_amount != null ? formatCurrency(item.reward_amount) : '-'}
                  </TableCell>
                  <TableCell>
                    {item.reward_date ? formatDateTime(item.reward_date) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className='border-border flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between'>
        <p className='text-muted-foreground text-sm'>共 {count} 条记录</p>
        <div className='flex flex-col gap-3 md:flex-row md:items-center'>
          {/* 移动端：select 单独一行 */}
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
          {/* 移动端：分页按钮单独一行 */}
          <div className='flex items-center gap-3'>
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
      </div>
    </Card>
  )
}

