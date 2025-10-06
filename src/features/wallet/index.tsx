import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// 模拟数据类型
interface WalletRecord {
  id: string
  position: string
  incomeType: string
  taskId?: string
  workDuration?: string
  hourlyRate?: number
  amount: number
  status: 'pending' | 'issued' | 'cancelled'
}

// 模拟数据
const mockRecords: WalletRecord[] = [
  {
    id: '213742',
    position: '大模型测评专家- (健身/营养学)',
    incomeType: '项目收入',
    taskId: '45364',
    workDuration: '3:54:32',
    hourlyRate: 100,
    amount: 390.88,
    status: 'pending'
  },
  {
    id: '213243',
    position: '大模型测评专家- (健身/营养学)',
    incomeType: '审核通过奖励',
    amount: 50,
    status: 'pending'
  }
]

const totalIncome = 440.88
const pendingAmount = 440.88
const estimatedPaymentDate = '2025/10/10'

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('income')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">待发放</Badge>
      case 'issued':
        return <Badge variant="default">已发放</Badge>
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>钱包</h1>
        </div>
        <Separator className='my-4 lg:my-6' />

        {/* 钱包概览卡片 */}
        <div className='flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl'>
          <Card className='flex-1 border border-gray-200'>
            <CardContent className='p-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium text-muted-foreground'>任务总收入</h3>
                <p className='text-2xl font-bold text-green-600'>¥ {totalIncome.toFixed(2)}</p>
                <p className='text-sm text-muted-foreground'>
                  统计截至日期 2025/10/06
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className='flex-1 border border-gray-200'>
            <CardContent className='p-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium text-muted-foreground'>本期待发放</h3>
                <p className='text-2xl font-bold text-orange-600'>¥ {pendingAmount.toFixed(2)}</p>
                <p className='text-sm text-muted-foreground'>
                  预计付款日期 {estimatedPaymentDate}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 历史记录 */}
        <div className='space-y-4'>
          <h2 className='text-lg font-semibold'>历史记录</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground'>
              <TabsTrigger value='income'>收入</TabsTrigger>
              <TabsTrigger value='payment'>付款记录</TabsTrigger>
              <TabsTrigger value='method'>付款方式</TabsTrigger>
            </TabsList>

            <TabsContent value='income' className='space-y-4'>
              <Card className='border border-gray-200'>
                <CardContent className='px-2 py-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>id</TableHead>
                        <TableHead>岗位</TableHead>
                        <TableHead>收入类型</TableHead>
                        <TableHead>任务 ID</TableHead>
                        <TableHead>工作时长</TableHead>
                        <TableHead>时薪</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className='font-medium'>{record.id}</TableCell>
                          <TableCell className='max-w-[200px] truncate'>{record.position}</TableCell>
                          <TableCell>{record.incomeType}</TableCell>
                          <TableCell>{record.taskId || '-'}</TableCell>
                          <TableCell>{record.workDuration || '-'}</TableCell>
                          <TableCell>{record.hourlyRate ? `¥${record.hourlyRate}` : '-'}</TableCell>
                          <TableCell className='font-medium text-green-600'>¥{record.amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='payment' className='space-y-4'>
              <Card className='border border-gray-200'>
                <CardContent className='p-6'>
                  <div className='text-center text-muted-foreground'>
                    <p>暂无付款记录</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='method' className='space-y-4'>
              <Card className='border border-gray-200'>
                <CardContent className='p-6'>
                  <div className='text-center text-muted-foreground'>
                    <p>暂无付款方式设置</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
