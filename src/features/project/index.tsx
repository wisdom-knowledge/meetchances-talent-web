import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  IconAlertCircle,
  IconCircleCheck,
  IconEye,
  IconLock,
} from '@tabler/icons-react'

export default function ProjectPage() {
  // Mock data - 在实际应用中，这些数据应该来自 API
  const maxSubmissionCount = 3
  // 模拟已提交次数，默认设置为 3
  const [submittedCount, _setSubmittedCount] = useState(3)
  const [isViewMode, setIsViewMode] = useState(false)

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
                <div className='text-2xl font-bold text-primary'>
                  {submittedCount}
                </div>
                <p className='text-xs text-muted-foreground'>
                  当前已成功提交的项目
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 警告横幅 - 当处于查看模式且达到上限时显示 */}
          {isLimitReached && isViewMode && (
            <div className='flex items-center justify-between gap-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200'>
              <div className='flex items-center gap-2'>
                <IconAlertCircle className='h-4 w-4' />
                <span>
                  当前处于查看模式。您已达到提交上限，请勿再次提交。
                </span>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='h-8 border-yellow-200 bg-white hover:bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-transparent dark:hover:bg-yellow-900/30 dark:text-yellow-200'
                onClick={() => setIsViewMode(false)}
              >
                <IconLock className='mr-2 h-3 w-3' />
                恢复锁定
              </Button>
            </div>
          )}

          {/* Iframe 区域 */}
          <Card className='relative flex-1 w-full overflow-hidden border bg-background'>
            {isLimitReached && !isViewMode && (
              <div className='absolute bottom-0 left-0 right-0 top-16 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300'>
                <div className='mx-4 max-w-md rounded-xl border bg-card p-6 text-center shadow-lg'>
                  <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
                    <IconAlertCircle className='h-6 w-6 text-red-600' />
                  </div>
                  <h3 className='text-xl font-bold text-card-foreground'>
                    提交次数已达上限
                  </h3>
                  <p className='mt-2 text-muted-foreground'>
                    您已达到最大提交次数 ({maxSubmissionCount}
                    次)，无法继续提交。
                  </p>
                  <div className='mt-6'>
                    <Button onClick={() => setIsViewMode(true)}>
                      <IconEye className='mr-2 h-4 w-4' />
                      查看提交记录
                    </Button>
                    <p className='mt-2 text-xs text-muted-foreground'>
                      点击解除遮罩以查看已提交的内容
                    </p>
                  </div>
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
