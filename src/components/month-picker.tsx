import { useMemo, useState } from 'react'
import { CaretSortIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface MonthPickerProps {
  value?: string // 格式: YYYY/MM，例如 2025/03
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
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

export function MonthPicker({ value, onChange, placeholder, disabled, className }: MonthPickerProps) {
  const [{ year }, setYm] = useState(() => ({ year: parseYearMonth(value).year }))
  const { month: selectedMonth } = useMemo(() => parseYearMonth(value), [value])

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ n: i + 1, label: `${i + 1}月` })),
    []
  )

  const displayLabel = useMemo(() => {
    if (!value) return undefined
    const { year: y, month: m } = parseYearMonth(value)
    return `${y}/${m.toString().padStart(2, '0')}`
  }, [value])

  const handlePick = (m: number) => {
    const next = `${year}/${m.toString().padStart(2, '0')}`
    onChange?.(next)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          disabled={disabled}
          className={cn('justify-between h-9 w-full', className)}
          aria-label='选择月份'
        >
          {displayLabel ?? placeholder ?? '选择月份'}
          <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[280px] p-3'>
        <div className='flex items-center justify-between pb-2'>
          <Button variant='ghost' size='icon' className='h-8 w-8' aria-label='上一年' onClick={() => setYm((s) => ({ year: s.year - 1 }))}>
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>
          <div className='text-sm font-medium'>{year} 年</div>
          <Button variant='ghost' size='icon' className='h-8 w-8' aria-label='下一年' onClick={() => setYm((s) => ({ year: s.year + 1 }))}>
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
        </div>
        <div className='grid grid-cols-4 gap-2'>
          {months.map((m) => {
            const isActive = m.n === selectedMonth && parseYearMonth(value).year === year
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
      </PopoverContent>
    </Popover>
  )
}

export default MonthPicker


