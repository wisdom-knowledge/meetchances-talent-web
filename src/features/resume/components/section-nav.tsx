import { type JSX, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
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
  activeId?: string
}

export default function SectionNav({ items, className, activeId }: SectionNavProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const underlineRef = useRef<HTMLDivElement | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const scheduleIdle = useRef<((cb: () => void) => void) | null>(null)
  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const updateUnderline = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (!activeId) return
    const btn = buttonRefs.current.get(activeId)
    if (!btn) return
    const left = btn.offsetLeft - container.scrollLeft
    const width = btn.offsetWidth
    const el = underlineRef.current
    if (!el) return
    const tx = Math.max(0, left)
    el.style.width = `${width}px`
    el.style.transform = `translate3d(${tx}px,0,0)`
  }, [activeId])

  useLayoutEffect(() => {
    // 初始化 idle 调度器
    scheduleIdle.current = (cb: () => void) => {
      try {
        const ric = (window as unknown as { requestIdleCallback?: (cb: IdleRequestCallback, opts?: { timeout?: number }) => number }).requestIdleCallback
        if (typeof ric === 'function') {
          ric(() => cb(), { timeout: 120 })
        } else {
          window.requestAnimationFrame(() => cb())
        }
      } catch {
        window.requestAnimationFrame(() => cb())
      }
    }
    updateUnderline()
  }, [updateUnderline, items.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onScroll = () => {
      if (rafIdRef.current != null) return
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null
        updateUnderline()
      })
    }
    const onResize = () => {
      const scheduler = scheduleIdle.current
      if (scheduler) scheduler(() => updateUnderline())
      else updateUnderline()
    }
    container.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    return () => {
      container.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [updateUnderline])

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
                'justify-start h-9 px-4 py-2 has-[>svg]:px-3 hover:bg-transparent hover:underline',
                activeId === item.id && 'text-primary'
              )}
              aria-current={activeId === item.id ? 'true' : undefined}
            >
              <span className='mr-2'>{item.icon}</span>
              {item.title}
            </button>
          ))}
        </nav>
      </ScrollArea>

      <div className='p-1 lg:hidden'>
        <div
          ref={containerRef}
          className='relative flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        >
          {items.map((item) => (
            <button
              key={item.id}
              ref={(el) => {
                if (!el) return
                buttonRefs.current.set(item.id, el)
              }}
              type='button'
              onClick={() => handleClick(item.id)}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'whitespace-nowrap h-9 px-3',
                activeId === item.id && 'text-primary'
              )}
              aria-current={activeId === item.id ? 'true' : undefined}
            >
              {item.title}
            </button>
          ))}
          <div
            ref={underlineRef}
            className='pointer-events-none absolute bottom-0 h-[2px] rounded bg-primary transition-transform duration-300 ease-out will-change-transform'
            style={{ width: '0px', transform: 'translate3d(0,0,0)' }}
          />
        </div>
      </div>
    </>
  )
}


