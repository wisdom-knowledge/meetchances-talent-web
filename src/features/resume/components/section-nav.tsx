import { type JSX, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface SectionNavItem {
  id: string
  title: string
  icon: JSX.Element
}

interface SectionNavProps {
  items: SectionNavItem[]
  className?: string
}

export default function SectionNav({ items, className }: SectionNavProps) {
  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <>
      <ScrollArea
        orientation='horizontal'
        type='always'
        className={cn(
          'bg-background hidden w-full min-w-40 px-1 py-2 lg:block',
          className
        )}
      >
        <nav className='flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0'>
          {items.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => handleClick(item.id)}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'justify-start h-9 px-4 py-2 has-[>svg]:px-3 hover:bg-transparent hover:underline'
              )}
            >
              <span className='mr-2'>{item.icon}</span>
              {item.title}
            </button>
          ))}
        </nav>
      </ScrollArea>

      <div className='p-1 lg:hidden'>
        <div className='flex gap-2 overflow-x-auto'>
          {items.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => handleClick(item.id)}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'whitespace-nowrap h-9 px-3'
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}


