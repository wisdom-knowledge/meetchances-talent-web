import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

export default function ProjectPage() {
  // Mock data - 在实际应用中，这些数据应该来自 API
  const maxSubmissionCount = 3
  // 模拟已提交次数，默认设置为 1
  const [submittedCount, _setSubmittedCount] = useState(3)

  const isLimitReached = submittedCount >= maxSubmissionCount

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='md:mx-16'>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>项目提交</h1>
        </div>

        <div className='flex flex-1 flex-col gap-4 overflow-hidden'>
          {/* 统计信息区域 */}
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  可提交次数
                </CardTitle>
                <IconAlertCircle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{maxSubmissionCount}</div>
                <p className='text-xs text-muted-foreground'>
                  项目最大可提交总数
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  已提交次数
                </CardTitle>
                <IconCircleCheck className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>{submittedCount}</div>
                <p className='text-xs text-muted-foreground'>
                  当前已成功提交的项目
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Iframe 区域 */}
          <Card className='flex-1 overflow-hidden relative border bg-background w-full'>
            {isLimitReached && (
              <div className='absolute top-16 bottom-0 left-0 right-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300'>
                <div className='text-center p-6 bg-card shadow-lg rounded-xl border max-w-md mx-4'>
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <IconAlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className='text-xl font-bold text-card-foreground'>提交次数已达上限</h3>
                  <p className='text-muted-foreground mt-2'>
                    您已达到最大提交次数 ({maxSubmissionCount}次)，无法继续提交。
                  </p>
                </div>
              </div>
            )}
            <iframe
              src="https://meetchances.feishu.cn/share/base/form/shrcnKBAteGcYSKHSkjMTLfAa6e"
              className='w-full h-full border-0 block'
              allowFullScreen
              title="Project Submission Form"
            />
          </Card>
        </div>
      </Main>
    </>
  )
}
