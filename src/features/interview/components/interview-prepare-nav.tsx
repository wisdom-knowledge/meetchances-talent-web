import { Button } from '@/components/ui/button'
import { IconArrowLeft } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface InterviewPrepareNavProps {
  onBackClick: () => void
  onSupportClick: () => void
}

// PC 端导航
function DesktopNav({
  onBackClick,
  onSupportClick,
}: InterviewPrepareNavProps) {
  return (
    <div className={cn('flex items-center justify-between mb-2 w-full max-w-screen-xl mx-auto')}>
      <div className='flex items-center'>
        <Button
          type='button'
          variant='ghost'
          onClick={onBackClick}
          aria-label='返回'
          className='cursor-pointer flex items-center gap-2'
        >
          <IconArrowLeft className='h-6 w-6 text-muted-foreground' />
          返回
        </Button>
      </div>
      <div className='flex items-center'>
        <Button variant='link' className='text-primary' onClick={onSupportClick}>
          寻求支持
        </Button>
      </div>
    </div>
  )
}

// 移动端导航
function MobileNav({
  onBackClick,
  onSupportClick,
}: InterviewPrepareNavProps) {
  return (
    <div className='flex items-center justify-between w-full h-12'>
      <Button
        type='button'
        variant='ghost'
        onClick={onBackClick}
        aria-label='返回'
        className='!p-0 !px-0 h-auto hover:bg-transparent'
      >
        <IconArrowLeft className='h-6 w-6 text-foreground' />
      </Button>
      <Button
        variant='link'
        className='text-primary underline decoration-primary !p-0 !px-0 h-auto'
        onClick={onSupportClick}
      >
        寻求支持
      </Button>
    </div>
  )
}

// 主组件
export function InterviewPrepareNav(props: InterviewPrepareNavProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileNav {...props} />
  }

  return <DesktopNav {...props} />
}

