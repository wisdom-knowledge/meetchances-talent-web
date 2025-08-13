import { cn } from '@/lib/utils'

interface ResumeSectionProps {
  id?: string
  title: string
  className?: string
  children: React.ReactNode
  variant?: 'card' | 'plain'
  contentClassName?: string
}

export default function ResumeSection({ id, title, className, children, variant = 'card', contentClassName }: ResumeSectionProps) {
  return (
    <section id={id} className={cn(className)}>
      <div className='mb-6'>
        <h2 className='text-xl font-medium leading-none'>{title}</h2>
      </div>
      {variant === 'card' ? (
        <div
          className={cn(
            'border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg',
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


