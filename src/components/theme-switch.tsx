import { useEffect, type ReactNode } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-context'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface ThemeSwitchProps {
  children?: ReactNode
}

export function ThemeSwitch({ children }: ThemeSwitchProps) {
  // Keep hook call to ensure provider existence; ignore value since theme is locked
  useTheme()

  /* Update theme-color meta tag
   * when theme is updated */
  // Theme is locked to light globally; keep meta tag consistent
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#fff')
  }, [])

  const hasLabel = Boolean(children)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size={hasLabel ? 'sm' : 'icon'}
          className={cn(
            hasLabel ? 'gap-2 h-8 rounded-md px-2' : 'scale-95 rounded-full',
            'cursor-not-allowed opacity-60'
          )}
          disabled
        >
          <span className='relative'>
            <IconSun className='size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
            <IconMoon className='absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          </span>
          {hasLabel ? (
            <span className='text-sm font-normal'>{children}</span>
          ) : (
            <span className='sr-only'>Toggle theme</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* Menu disabled: theme is locked to light */}
      <DropdownMenuContent align='end' className='hidden' />
    </DropdownMenu>
  )
}
