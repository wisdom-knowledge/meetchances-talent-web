import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchColumnId?: string
  searchPlaceholder?: string
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId = 'username',
  searchPlaceholder = '搜索姓名...',
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const hasStatus = table.getAllLeafColumns().some((c) => c.id === 'status')
  const hasRole = table.getAllLeafColumns().some((c) => c.id === 'role')
  const hasInterview = table.getAllLeafColumns().some((c) => c.id === 'interviewStatus')

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn(searchColumnId)?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn(searchColumnId)?.setFilterValue(event.target.value)
          }
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <div className='flex gap-x-2'>
          {hasStatus && table.getColumn('status') && (
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title='注册状态'
              options={[
                { label: '已注册', value: 'registered' },
                { label: '未注册', value: 'unregistered' },
              ]}
            />
          )}
          {hasInterview && table.getColumn('interviewStatus') && (
            <DataTableFacetedFilter
              column={table.getColumn('interviewStatus')}
              title='面试状态'
              options={[
                { label: '未面试', value: 'not_interviewed' },
                { label: '已面试', value: 'interviewed' },
              ]}
            />
          )}
          {hasRole && table.getColumn('role') && (
            <DataTableFacetedFilter
              column={table.getColumn('role')}
              title='人才状态'
              options={[
                { label: '可聘请', value: 'invitable' },
                { label: '锁定中', value: 'locked' },
              ]}
            />
          )}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            清除筛选
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
