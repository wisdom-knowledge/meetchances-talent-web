import { useEffect } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { userEvent } from '@/lib/apm'

interface GeneralErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  minimal?: boolean
}

export default function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()
  useEffect(() => {
    const extras = {
      status_code: '500',
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || '',
    }
    userEvent('error_500_view', '500 通用错误页', extras)
  }, [])
  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
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
          </div>
        )}
      </div>
    </div>
  )
}
