import * as React from 'react'
import { IconChevronLeft } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'

export interface TitleBarProps {
  title: string
  subtitle?: string
  back?: boolean
  onBack?: () => void
  separator?: boolean
}

export default function TitleBar({ title, subtitle, back = false, onBack, separator = false }: TitleBarProps) {
  const env = useRuntimeEnv()
  const isMobile = env === 'mobile'

  const handleBack = React.useCallback(() => {
    if (onBack) onBack()
    else window.history.back()
  }, [onBack])

  const content = isMobile ? (
    <div className='relative px-0 py-1 mb-2'>
      {back && (
        <button
          type='button'
          aria-label='返回'
          onClick={handleBack}
          className='absolute left-0 top-1/2 -translate-y-1/2 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 transition-transform'
        >
          <IconChevronLeft className='h-6 w-6' />
        </button>
      )}
      <h1 className='text-2xl font-bold tracking-tight text-center md:text-2xl'>{title}</h1>
    </div>
  ) : (
    <div className='md:flex md:items-end'>
      <h1 className='text-xl font-bold tracking-tight md:text-2xl mr-3'>{title}</h1>
      {subtitle ? <p className='text-muted-foreground'>{subtitle}</p> : null}
    </div>
  )

  return (
    <>
      {content}
      {separator && !isMobile ? <Separator className='my-4 lg:my-6' /> : null}
    </>
  )
}


