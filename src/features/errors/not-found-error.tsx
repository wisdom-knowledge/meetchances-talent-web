import { useEffect } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { userEvent } from '@/lib/apm'

export default function NotFoundError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  useEffect(() => {
    const extras = {
      status_code: '404',
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || '',
    }
    userEvent('error_404_view', '404 未找到错误页', extras)
  }, [])
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
        <span className='font-medium'>抱歉，页面不存在</span>
        <p className='text-muted-foreground text-center'>
          您访问的页面不存在，或已被移除。
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
