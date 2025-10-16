import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'

interface HeaderProps {
  className?: string
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
  children?: React.ReactNode
  showSidebarTrigger?: boolean
}

export const Header = ({ className, fixed, children, showSidebarTrigger = true }: HeaderProps) => {
  const env = useRuntimeEnv()
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  // 移动端隐藏全局 Header
  if (env === 'mobile' || env === 'wechat-miniprogram') return (
    <p className='h-4'></p>
  )

  return (
    <header
      className={cn(
        'z-50 h-16',
        fixed && 'header-fixed peer/header sticky top-0',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 p-4 sm:gap-4',
          offset > 10 &&
            fixed &&
            'after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg'
        )}
      >
        {showSidebarTrigger ? (
          <>
            <SidebarTrigger variant='outline' className='max-md:scale-125 md:hidden' />
            <Separator orientation='vertical' className='h-6 md:hidden' />
          </>
        ) : null}
        {children}
      </div>
    </header>
  )
}

Header.displayName = 'Header'
