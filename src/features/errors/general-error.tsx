import { useEffect } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { userEvent } from '@/lib/apm'

interface GeneralErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  minimal?: boolean
  error?: Error | unknown
  reset?: () => void
}

export default function GeneralError({
  className,
  minimal = false,
  error,
  reset,
}: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()
  
  // 提取错误信息
  const errorMessage = error instanceof Error ? error.message : String(error || '未知错误')
  const errorStack = error instanceof Error ? error.stack : undefined
  
  useEffect(() => {
    const extras = {
      status_code: '500',
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || '',
      error_message: errorMessage,
      error_stack: errorStack?.substring(0, 500), // 只记录前500字符
    }
    userEvent('error_500_view', '500 通用错误页', extras)
    
    // 同时在控制台输出完整错误信息（开发模式）
    if (import.meta.env.DEV && error) {
      // eslint-disable-next-line no-console
      console.error('🔴 页面错误:', error)
      if (errorStack) {
        // eslint-disable-next-line no-console
        console.error('📍 错误堆栈:', errorStack)
      }
    }
  }, [error, errorMessage, errorStack])
  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        {!minimal && (
          <h1 className='text-[7rem] leading-tight font-bold'>500</h1>
        )}
        <span className='font-medium'>抱歉，系统出现错误</span>
        <p className='text-muted-foreground text-center'>
          给您带来不便请谅解。<br /> 请稍后再试。
        </p>
        {!minimal && (
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => history.go(-1)}>
              返回上一页
            </Button>
            <Button onClick={() => navigate({ to: '/' })}>回到首页</Button>
            {reset && (
              <Button variant='secondary' onClick={reset}>
                重试
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
