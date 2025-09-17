import { useEffect } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { userEvent } from '@/lib/apm'

export default function ForbiddenError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  useEffect(() => {
    const extras = {
      status_code: '403',
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || '',
    }
    userEvent('error_403_view', '403 禁止访问错误页', extras)
  }, [])
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>403</h1>
        <span className='font-medium'>没有访问权限</span>
        <p className='text-muted-foreground text-center'>
          您没有足够的权限查看该资源。
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            返回上一页
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>回到首页</Button>
        </div>
      </div>
    </div>
  )
}
