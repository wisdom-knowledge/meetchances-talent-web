import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTablePagination } from '@/features/users/components/data-table-pagination'
import { DataTableToolbar } from '@/features/users/components/data-table-toolbar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import TalentResumePreview from './talent-resume-preview'
import type { ResumeFormValues } from '@/features/resume/data/schema'
import { fetchResumeDetail } from '@/features/resume-upload/utils/api'

export interface TalentItem {
  resume_id?: number
  name: string
  isRegistered: boolean
  talentStatus: '可聘请' | '锁定中'
  matchScore?: number | '-'
  interviewStatus?: number
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string
  }
}

export interface ServerFilterParams {
  name?: string
  registration_status?: number[]
  talent_status?: number[]
  interview_status?: number[]
}

export interface InviteContextLike {
  headhunterName?: string
  jobTitle?: string
  salaryMin?: number
  salaryMax?: number
  link?: string
}

export interface TalentTableProps {
  data: TalentItem[]
  onFilterChange?: (filters: ServerFilterParams) => void
  mode?: 'talentPool' | 'jobRecommend'
  inviteContext?: InviteContextLike
}
export default function TalentTable({ data, onFilterChange, mode = 'talentPool', inviteContext }: TalentTableProps) {
  const [resumeOpen, setResumeOpen] = useState(false)
  const [current, setCurrent] = useState<TalentItem | null>(null)
  const [resumeValues, setResumeValues] = useState<ResumeFormValues | null>(null)
  const mergedInviteContext = useMemo(() => ({ link: 'https://talent.meetchances.com/', ...(inviteContext ?? {}) }), [inviteContext])

  const mapStructInfoToResumeValues = useCallback((struct: StructInfo | undefined, fallbackName?: string): ResumeFormValues => {
    const basic = struct?.basic_info ?? {}
    const exp = struct?.experience ?? {}
    const self = struct?.self_assessment ?? {}

    const work = Array.isArray(exp?.work_experience)
      ? exp.work_experience.map((w) => ({
          organization: w?.organization ?? '',
          title: w?.title ?? '',
          startDate: w?.start_date ?? '',
          endDate: w?.end_date ?? '',
          city: w?.city ?? '',
          employmentType: w?.employment_type ?? '',
          achievements: Array.isArray(w?.achievements) ? w.achievements.join('\n') : '',
        }))
      : []

    const projects = Array.isArray(exp?.project_experience)
      ? exp.project_experience.map((p) => ({
          organization: p?.organization ?? '',
          role: p?.role ?? '',
          startDate: p?.start_date ?? '',
          endDate: p?.end_date ?? '',
          achievements: Array.isArray(p?.achievements) ? p.achievements.join('\n') : '',
        }))
      : []

    const education = Array.isArray(exp?.education)
      ? exp.education.map((e) => ({
          institution: e?.institution ?? '',
          major: e?.major ?? '',
          degreeType: e?.degree_type ?? '',
          degreeStatus: e?.degree_status ?? '',
          city: e?.city ?? '',
          startDate: e?.start_date ?? '',
          endDate: e?.end_date ?? '',
          achievements: Array.isArray(e?.achievements) ? e.achievements.join('\n') : '',
        }))
      : []

    const hardSkills = Array.isArray(self?.hard_skills)
      ? self.hard_skills.map((s) => s?.skill_name).filter(Boolean).join('、')
      : ''

    const gender = ((): '男' | '女' | '其他' | '不愿透露' | undefined => {
      const g = basic?.gender ?? undefined
      if (g === '男' || g === '女' || g === '其他' || g === '不愿透露') return g
      return undefined
    })()

    const values: ResumeFormValues = {
      name: basic?.name ?? fallbackName ?? '',
      phone: basic?.phone ?? '',
      city: basic?.city ?? '',
      gender,
      email: basic?.email ?? '',
      origin: '',
      expectedSalary: '',
      hobbies: '',
      skills: hardSkills,
      workSkills: [],
      softSkills: '',
      selfEvaluation: self?.summary ?? '',
      workExperience: work,
      projectExperience: projects,
      education,
    }
    return values
  }, [])

  const handlePreview = useCallback(async (item: TalentItem) => {
    setCurrent(item)
    setResumeOpen(true)
    if (!item.resume_id) {
      setResumeValues({
        name: item.name,
        phone: '',
        city: '',
        gender: undefined,
        email: '',
        origin: '',
        expectedSalary: '',
        hobbies: '',
        skills: '',
        workSkills: [],
        softSkills: '',
        selfEvaluation: '',
        workExperience: [],
        projectExperience: [],
        education: [],
      })
      return
    }
    const res = await fetchResumeDetail(item.resume_id)
    const struct = res.success ? (res.item?.backend?.struct_info as StructInfo | undefined) : undefined
    const values: ResumeFormValues = mapStructInfoToResumeValues(struct, item.name)
    setResumeValues(values)
  }, [mapStructInfoToResumeValues])

  interface StructInfo {
    basic_info?: {
      city?: string | null
      name?: string | null
      email?: string | null
      phone?: string | null
      gender?: '男' | '女' | string | null
    }
    experience?: {
      education?: Array<{
        city?: string | null
        major?: string | null
        end_date?: string | null
        start_date?: string | null
        degree_type?: string | null
        institution?: string | null
        achievements?: string[] | null
        degree_status?: string | null
      }>
      work_experience?: Array<{
        city?: string | null
        title?: string | null
        end_date?: string | null
        start_date?: string | null
        achievements?: string[] | null
        organization?: string | null
        employment_type?: string | null
      }>
      project_experience?: Array<{
        role?: string | null
        end_date?: string | null
        start_date?: string | null
        achievements?: string[] | null
        organization?: string | null
      }>
    }
    self_assessment?: {
      summary?: string | null
      hard_skills?: Array<{ skill_name?: string | null; proficiency?: string | null }>
      soft_skills?: unknown[]
    } | null
  }

  const columns: ColumnDef<TalentItem>[] = useMemo(() => {
    const nameCol: ColumnDef<TalentItem> = {
      accessorKey: 'name',
      header: '姓名',
      meta: { className: 'w-[25%]' },
    }

    if (mode === 'jobRecommend') {
      return [
        nameCol,
        {
          accessorKey: 'matchScore',
          header: '人岗匹配分',
          cell: ({ row }) => <span>{row.original.matchScore ?? '-'}</span>,
          meta: { className: 'w-[20%]' },
        },
        {
          accessorKey: 'interviewStatus',
          header: '面试状态',
          cell: ({ row }) => {
            const v = row.original.interviewStatus
            const text = v === 10 ? '已面试' : v === 0 ? '未面试' : '-'
            return <Badge variant={v === 10 ? 'default' : 'outline'}>{text}</Badge>
          },
          meta: { className: 'w-[20%]' },
        },
        {
          accessorKey: 'role',
          header: '人才状态',
          cell: ({ row }) => (
            <Badge variant={row.original.talentStatus === '可聘请' ? 'emphasis' : 'secondary'}>
              {row.original.talentStatus}
            </Badge>
          ),
          meta: { className: 'w-[20%]' },
        },
        {
          id: 'actions',
          header: () => <div className='text-right'>操作</div>,
          cell: ({ row }) => {
            const item = row.original
            return (
              <div className='text-right'>
                <Button variant='link' className='px-0' onClick={() => handlePreview(item)}>查看简历</Button>
              </div>
            )
          },
          meta: { className: 'w-[15%]' },
        },
      ]
    }

    // talentPool 模式
    return [
      nameCol,
      {
        accessorKey: 'status',
        header: '注册状态',
        cell: ({ row }) => (
          <Badge variant={row.original.isRegistered ? 'default' : 'outline'}>
            {row.original.isRegistered ? '已注册' : '未注册'}
          </Badge>
        ),
        meta: { className: 'w-[25%]' },
      },
      {
        accessorKey: 'role',
        header: '人才状态',
        cell: ({ row }) => (
          <Badge variant={row.original.talentStatus === '可聘请' ? 'emphasis' : 'secondary'}>
            {row.original.talentStatus}
          </Badge>
        ),
        meta: { className: 'w-[25%]' },
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>操作</div>,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className='text-right'>
              <Button variant='link' className='px-0' onClick={() => handlePreview(item)}>查看简历</Button>
            </div>
          )
        },
        meta: { className: 'w-[25%]' },
      },
    ]
  }, [mode, handlePreview])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // 将表格筛选项映射为服务端过滤参数并上抛
  useEffect(() => {
    if (!onFilterChange) return
    const findFilter = (id: string) => columnFilters.find((f) => f.id === id)?.value

    const nameFilterRaw = findFilter('name') as string | undefined
    const statusFilterRaw = findFilter('status') as string[] | undefined
    const roleFilterRaw = findFilter('role') as string[] | undefined
    const interviewFilterRaw = findFilter('interviewStatus') as string[] | undefined

    const registrationMap: Record<string, number> = { registered: 10, unregistered: 0 }
    const talentMap: Record<string, number> = { invitable: 0, locked: 10 }

    const name = typeof nameFilterRaw === 'string' && nameFilterRaw.trim() ? nameFilterRaw.trim() : undefined
    const registration_status = Array.isArray(statusFilterRaw)
      ? statusFilterRaw.map((v) => registrationMap[v]).filter((v) => v !== undefined)
      : undefined
    const talent_status = Array.isArray(roleFilterRaw)
      ? roleFilterRaw.map((v) => talentMap[v]).filter((v) => v !== undefined)
      : undefined
    const interviewMap: Record<string, number> = { not_interviewed: 0, interviewed: 10 }
    const interview_status = Array.isArray(interviewFilterRaw)
      ? interviewFilterRaw.map((v) => interviewMap[v]).filter((v) => v !== undefined)
      : undefined

    onFilterChange({ name, registration_status, talent_status, interview_status })
  }, [columnFilters, onFilterChange])

  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} searchColumnId='name' searchPlaceholder='搜索姓名...' />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className={header.column.columnDef.meta?.className ?? ''}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='group/row'>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className ?? ''}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      {/* Drawer: 简历预览 */}
      <Sheet open={resumeOpen} onOpenChange={setResumeOpen}>
        <SheetContent className='flex w-full sm:max-w-none md:w-[85vw] lg:w-[60vw] xl:w-[50vw] flex-col px-4 md:px-5'>
          <SheetTitle className='sr-only'>简历预览</SheetTitle>
          <div className='flex pt-2 pb-2'>
            <div className='text-2xl font-semibold'>{current?.name ?? '简历预览'}</div>
          </div>
          {resumeValues && <TalentResumePreview values={resumeValues} inviteContext={mergedInviteContext} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}


