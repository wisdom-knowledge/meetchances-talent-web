import { cn } from '@/lib/utils'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'

interface ResumeSectionProps {
  id?: string
  title: string
  className?: string
  children: React.ReactNode
  variant?: 'card' | 'plain'
  contentClassName?: string
}

export default function ResumeSection({ id, title, className, children, variant = 'card', contentClassName }: ResumeSectionProps) {
  const env = useRuntimeEnv()
  const isMiniProgram = env === 'wechat-miniprogram'
  return (
    <section id={id} className={cn(className)}>
      <div className='mb-6'>
        <h2 className='text-xl font-medium leading-none'>{title}</h2>
      </div>
      {variant === 'card' ? (
        <div
          className={cn(
            'border border-block-layout-border bg-block-layout text-block-layout-foreground shadow-xs rounded-lg',
            isMiniProgram ? 'p-4' : 'p-4 md:p-6',
            contentClassName
          )}
        >
          {children}
        </div>
      ) : (
        <div className={cn(contentClassName)}>{children}</div>
      )}
    </section>
  )
}


