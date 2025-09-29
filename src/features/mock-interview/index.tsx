import { useMemo, useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearch, useNavigate } from '@tanstack/react-router'
import {
  IconSearch,
  IconDeviceLaptop,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
// empty state asset moved into component
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import MockEmptyState from '@/features/mock-interview/components/empty-state'
import MockCard from '@/features/mock-interview/components/mock-card'
import { fetchMockInterviewList, fetchMockCategories } from './api'
import type { BackendMockJobItem } from './types'

type CategoryOption = {
  id: number
  label: string
  icon?: string
  Icon: React.ElementType
}

export default function MockInterviewPage() {
  const search = useSearch({ from: '/_public/mock-interview/' }) as {
    page?: number
    pageSize?: number
    q?: string
    category?: string
  }
  const navigate = useNavigate()

  const [q, setQ] = useState(search.q ?? '')
  const [qInput, setQInput] = useState(search.q ?? '')
  const [category, setCategory] = useState<number | undefined>(
    search.category ? Number(search.category) : undefined
  )
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const catScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [page, setPage] = useState(search.page ?? 1)
  const [pageSize] = useState(search.pageSize ?? 12)

  // 同步状态到 URL
  useEffect(() => {
    navigate({
      to: '/mock-interview',
      search: {
        page,
        pageSize,
        q,
        category: category != null ? String(category) : undefined,
      },
      replace: true,
    }).catch(() => {})
  }, [page, pageSize, q, category, navigate])

  const { data } = useQuery({
    queryKey: ['mock-interview', { q, category, page, pageSize }],
    queryFn: () =>
      fetchMockInterviewList({
        name: q,
        category_id: category,
        skip: (page - 1) * pageSize,
        limit: pageSize,
        q: undefined,
      }),
    enabled: categories.length !== 0 && category !== undefined,
  })

  const items = useMemo(() => data?.items ?? [], [data])
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // 拉取分类
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await fetchMockCategories()
        if (!mounted) return
        const fallbackIcon = IconDeviceLaptop
        const mapped: CategoryOption[] = (list || []).map((it) => ({
          id: it.category_id,
          label: it.category_name,
          icon: it.image,
          Icon: fallbackIcon, // 兜底使用统一图标；若后续需要根据 icon 动态渲染，可扩展
        }))
        setCategories(mapped)
        // 只在初始化时设置默认分类
        if (search.category === undefined && mapped.length > 0) {
          setCategory(mapped[0].id)
        }
      } catch {
        setCategories([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [search.category])

  // 计算分类横向滚动的左右可滚动状态
  useEffect(() => {
    const el = catScrollRef.current
    if (!el) return
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }
    update()
    el.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [categories.length])

  function buildPages(tp: number, current: number): Array<number | 'ellipsis'> {
    const pages: Array<number | 'ellipsis'> = []
    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (current > 4) pages.push('ellipsis')
    const start = Math.max(2, current - 1)
    const end = Math.min(tp - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < tp - 3) pages.push('ellipsis')
    pages.push(tp)
    return pages
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between'>
          <h1 className='space-y-0.5 text-2xl font-bold tracking-tight md:text-3xl'>
            模拟面试
          </h1>
          <Button
            variant='ghost'
            onClick={() => navigate({ to: '/mock-interview/records' })}
            className='mr-[28px] !text-[#4E02E4] hover:!text-[#4E02E4]/80 focus-visible:!text-[#4E02E4] active:!text-[#4E02E4]'
          >
            我的记录
          </Button>
        </div>

        {/* 搜索条 */}
        <div className='mt-3'>
          <form
            className='relative max-w-xl'
            onSubmit={(e) => {
              e.preventDefault()
              setPage(1)
              setQ(qInput)
            }}
          >
            <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onBlur={() => {
                setPage(1)
                setQ(qInput)
              }}
              placeholder='搜索您想针对提升的面试类型/技能'
              className='h-10 pl-9'
            />
          </form>
        </div>

        <Separator className='my-4 lg:my-6' />

        {/* 快捷分类（横向滚动 + 箭头导航） */}
        <div className='relative mb-5'>
          <button
            type='button'
            aria-label='scroll-left'
            onClick={() => {
              try {
                catScrollRef.current?.scrollBy({
                  left: -240,
                  behavior: 'smooth',
                })
              } catch (_e) {
                /* noop */
              }
            }}
            disabled={!canScrollLeft}
            className='hover:bg-muted absolute top-1/2 left-0 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border bg-white shadow disabled:cursor-not-allowed disabled:opacity-40'
          >
            <IconChevronLeft className='h-4 w-4' />
          </button>
          <div
            ref={catScrollRef}
            className='mx-9 flex items-stretch gap-6 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            {categories.map(({ id, label, Icon }) => {
              const active = category === id
              return (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className='group inline-flex max-w-[120px] min-w-[88px] shrink-0 flex-col items-center gap-2 text-sm'
                >
                  <span
                    className={[
                      'inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors',
                      active
                        ? 'text-primary'
                        : 'text-foreground/80 group-hover:text-primary',
                    ].join(' ')}
                  >
                    <Icon className='h-6 w-6' />
                  </span>
                  <span
                    className={[
                      active ? 'text-primary' : 'text-foreground/80',
                      'group-hover:text-primary transition-colors',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            type='button'
            aria-label='scroll-right'
            onClick={() => {
              try {
                catScrollRef.current?.scrollBy({
                  left: 240,
                  behavior: 'smooth',
                })
              } catch (_e) {
                /* noop */
              }
            }}
            disabled={!canScrollRight}
            className='hover:bg-muted absolute top-1/2 right-0 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border bg-white shadow disabled:cursor-not-allowed disabled:opacity-40'
          >
            <IconChevronRight className='h-4 w-4' />
          </button>
        </div>

        {/* 列表（自适应高度 + 纵向滚动） */}
        <div className='flex min-h-0 flex-1'>
          {items.length === 0 ? (
            <MockEmptyState />
          ) : (
            <div className='grid flex-1 grid-cols-1 gap-5 overflow-y-auto pr-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-2'>
              {items.map((it: BackendMockJobItem, idx: number) => (
                <MockCard
                  key={it.id}
                  item={{
                    interview_id: it.id,
                    title: it.title,
                    summary: it.description,
                    durationMinutes: it.interview_duration_minutes,
                    category: it.category_name,
                    id: it.id,
                  }}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        <div className='mt-4 flex items-center justify-end gap-4'>
          <div className='text-muted-foreground text-sm'>共 {total} 条</div>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              上一页
            </Button>
            {buildPages(totalPages, page).map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e-${i}`} className='text-muted-foreground px-2'>
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  size='sm'
                  variant={p === page ? 'default' : 'outline'}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      </Main>
    </>
  )
}
