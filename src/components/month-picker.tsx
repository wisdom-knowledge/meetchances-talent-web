import { useMemo, useState } from 'react'
import { CaretSortIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface MonthPickerProps {
  value?: string // 格式: YYYY/MM，例如 2025/03
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  // 是否允许选择“至今”
  allowPresent?: boolean
}

function parseYearMonth(input?: string): { year: number; month: number } {
  const now = new Date()
  if (!input) return { year: now.getFullYear(), month: now.getMonth() + 1 }
  const match = /^\s*(\d{4})[-/]?(\d{1,2})\s*$/.exec(input)
  if (!match) return { year: now.getFullYear(), month: now.getMonth() + 1 }
  const year = Number(match[1])
  const month = Math.min(12, Math.max(1, Number(match[2])))
  return { year, month }
}

export function MonthPicker({ value, onChange, placeholder, disabled, className, allowPresent }: MonthPickerProps) {
  const [{ year }, setYm] = useState(() => ({ year: parseYearMonth(value).year }))
  const { year: selectedYear, month: selectedMonth } = useMemo(() => parseYearMonth(value), [value])
  const [mode, setMode] = useState<'month' | 'year'>('month')
  const [open, setOpen] = useState(false)
  const presentLabel = '至今'
  const isPresentSelected = allowPresent && (value?.trim() === presentLabel)

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ n: i + 1, label: `${i + 1}月` })),
    []
  )

  const displayLabel = useMemo(() => {
    if (!value) return undefined
    if (allowPresent && value.trim() === presentLabel) return presentLabel
    const { year: y, month: m } = parseYearMonth(value)
    return `${y}/${m.toString().padStart(2, '0')}`
  }, [value, allowPresent])

  const handlePick = (m: number) => {
    const next = `${year}/${m.toString().padStart(2, '0')}`
    onChange?.(next)
    setOpen(false)
  }

  // 年份页（12 年一页）
  const yearPageStart = useMemo(() => Math.floor(year / 12) * 12, [year])
  const yearOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => yearPageStart + i), [yearPageStart])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          disabled={disabled}
          className={cn('justify-between gap-2 overflow-hidden h-9 w-full', className)}
          aria-label='选择月份'
        >
          <span className={cn('flex-1 min-w-0 truncate text-left', !displayLabel && 'text-muted-foreground')}>
            {displayLabel ?? placeholder ?? '选择月份'}
          </span>
          <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[280px] p-3'>
        <div className='flex items-center justify-between pb-2'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            aria-label={mode === 'year' ? '上一页年份' : '上一年'}
            onClick={() => setYm((s) => ({ year: s.year - (mode === 'year' ? 12 : 1) }))}
          >
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className='text-sm font-medium cursor-pointer underline underline-offset-4'
                onClick={() => setMode('year')}
                aria-label='选择年份'
              >
                {year} 年
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>点击选择年份</TooltipContent>
          </Tooltip>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            aria-label={mode === 'year' ? '下一页年份' : '下一年'}
            onClick={() => setYm((s) => ({ year: s.year + (mode === 'year' ? 12 : 1) }))}
          >
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
        </div>
        {mode === 'year' ? (
          <div className='grid grid-cols-4 gap-2'>
            {yearOptions.map((y) => {
              const isActive = !isPresentSelected && y === selectedYear
              return (
                <Button
                  key={y}
                  type='button'
                  variant={isActive ? 'default' : 'ghost'}
                  className='h-9'
                  onClick={() => {
                    setYm({ year: y })
                    setMode('month')
                  }}
                >
                  {y}
                </Button>
              )
            })}
          </div>
        ) : (
          <div className='grid grid-cols-4 gap-2'>
            {months.map((m) => {
              const isActive = !isPresentSelected && m.n === selectedMonth && selectedYear === year
              return (
                <Button
                  key={m.n}
                  type='button'
                  variant={isActive ? 'default' : 'ghost'}
                  className='h-9'
                  onClick={() => handlePick(m.n)}
                >
                  {m.label}
                </Button>
              )
            })}
          </div>
        )}
        {allowPresent && mode === 'month' && (
          <div className='mt-3'>
            <Button
              type='button'
              variant={value?.trim() === presentLabel ? 'default' : 'ghost'}
              className='h-9 w-full'
              onClick={() => {
                onChange?.(presentLabel)
                setOpen(false)
              }}
            >
              {presentLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default MonthPicker


