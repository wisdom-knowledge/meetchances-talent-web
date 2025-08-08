import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/features/tasks/components/data-table-column-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination } from '@/features/tasks/components/data-table-pagination'

export interface AnnotateTaskItem {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done' | 'rejected'
  qualityScore: number
  aiScore: number
  durationSec: number
}

interface TaskDetailsSectionProps {
  data: AnnotateTaskItem[]
}

function formatSecondsToMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.max(0, Math.round(totalSeconds % 60))
  return `${minutes}m${seconds.toString().padStart(2, '0')}s`
}

export default function TaskDetailsSection({ data }: TaskDetailsSectionProps) {
  const columns = React.useMemo<ColumnDef<AnnotateTaskItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='任务ID' />
        ),
        cell: ({ row }) => <div className='w-[100px]'>{row.getValue('id')}</div>,
        enableHiding: false,
      },
      // 删除 标题列 和 状态列
      {
        accessorKey: 'aiScore',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='AI审核得分' />
        ),
        cell: ({ row }) => <span>{row.getValue('aiScore')}</span>,
      },
      {
        accessorKey: 'qualityScore',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='人工审核得分' />
        ),
        cell: ({ row }) => <span>{row.getValue('qualityScore')}</span>,
      },
      {
        accessorKey: 'durationSec',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='标注耗时' />
        ),
        cell: ({ row }) => <span>{formatSecondsToMmSs(row.getValue('durationSec'))}</span>,
      },
      {
        id: 'actions',
        header: '操作',
        cell: () => (
          <Button variant='link' size='sm' className='px-0'>查看详情</Button>
        ),
        enableSorting: false,
      },
    ],
    []
  )

  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />
      <h2 className='mb-2 text-xl font-semibold text-gray-900'>试标任务详情</h2>
      <div className='flex-1 overflow-auto px-0 py-1'>
        <SimpleDataTable data={data} columns={columns} />
      </div>
    </div>
  )
}

function SimpleDataTable<TData, TValue>({
  data,
  columns,
}: {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
}) {
  const [sorting, setSorting] = React.useState<import('@tanstack/react-table').SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className='space-y-4'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table as unknown as import('@tanstack/react-table').Table<TData>} />
    </div>
  )
}


