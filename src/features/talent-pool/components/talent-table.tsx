import { useState } from 'react'
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
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTablePagination } from '@/features/users/components/data-table-pagination'
import { DataTableToolbar } from '@/features/users/components/data-table-toolbar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { mockResumeByTalentId } from '../data/mock-resume'
import TalentResumePreview from './talent-resume-preview'
import type { ResumeFormValues } from '@/features/resume/data/schema'

export interface TalentItem {
  id: number
  name: string
  isRegistered: boolean
  talentStatus: '可邀请' | '锁定中'
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string
  }
}

export interface TalentTableProps {
  data: TalentItem[]
}
export default function TalentTable({ data }: TalentTableProps) {
  const [resumeOpen, setResumeOpen] = useState(false)
  const [current, setCurrent] = useState<TalentItem | null>(null)

  const handlePreview = (item: TalentItem) => {
    setCurrent(item)
    setResumeOpen(true)
  }
  const baseColumns: ColumnDef<TalentItem>[] = [
    {
      accessorKey: 'name',
      header: '姓名',
      meta: { className: 'w-[25%]' },
    },
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
        <Badge variant={row.original.talentStatus === '可邀请' ? 'emphasis' : 'secondary'}>
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

  const columns: ColumnDef<TalentItem>[] = baseColumns

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
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

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
          <div className='flex pt-2 pb-2'>
            <div className='text-2xl font-semibold'>{current?.name ?? '简历预览'}</div>
          </div>
          {(() => {
            const mock = mockResumeByTalentId(current?.id ?? 0, current?.name)
            // 映射为 ResumeFormValues 以复用现有简历各模块组件
            const values: ResumeFormValues = {
              name: mock.name,
              phone: mock.phone,
              city: mock.city,
              gender: undefined,
              email: mock.email,
              origin: '',
              expectedSalary: '',
              hobbies: '',
              skills: mock.skills.join('、'),
              workSkillName: '',
              workSkillLevel: undefined,
              softSkills: '',
              selfEvaluation: mock.selfEvaluation,
              workExperience: mock.workExperience.map((w) => ({
                organization: w.organization,
                title: w.title,
                startDate: w.start,
                endDate: w.end,
                city: '',
                employmentType: '',
                achievements: w.achievements.join('\n'),
              })),
              projectExperience: mock.projects.map((p) => ({
                organization: p.name,
                role: p.role,
                startDate: p.start,
                endDate: p.end,
                achievements: p.achievements.join('\n'),
              })),
              education: mock.education.map((e) => ({
                institution: e.institution,
                major: e.major,
                degreeType: e.degree,
                degreeStatus: '',
                city: '',
                startDate: e.start,
                endDate: e.end,
                achievements: '',
              })),
            }
            return <TalentResumePreview values={values} />
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}


