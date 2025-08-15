import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  indicatorClassName?: string
}

export function Progress({
  value = 0,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <div
        className={cn('h-full w-0 bg-primary transition-[width] duration-300', indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export default Progress


