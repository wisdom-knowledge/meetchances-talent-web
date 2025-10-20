import { useQuery, useInfiniteQuery, type UseQueryOptions, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query'
import { api } from '@/lib/api'
// import { api } from '@/lib/api'
import { ApiJob } from '../jobs/api'

export interface InviteInfoParams {
  token: string
}

export enum InterviewStatus {
  NOT_REGISTERED = 0,
  NOT_COMPLETED = 10,
  COMPLETED = 20,
}

export interface ApiApplyListItem {
  id: number
  job_id: number
  match_score: number // 人岗匹配分，默认-1
  interview_status: InterviewStatus // 人岗状态：0-未注册，10-未完成面试，20-已面试
  match_score_status: number // 匹配分计算状态：0-未计算，10-计算中，20-成功
  recommend_type: number // 推荐类型：1-猎头推荐，2-自荐
  phone: string
  created_at: number
  updated_at: number
  job_detail: ApiJob & { online_status?: number; company?: { name?: string } } // 岗位详细信息（扩展 online_status）
  progress: number // 当前进度
  total_step: number // 总步骤数
  /**
   * 当前申请的流程节点状态（字符串枚举）
   * '0': 未开始(视为进行中)
   * '10': 进行中
   * '20': 审核中
   * '30': 通过
   * '40': 已拒绝
   * '50': 打回(视为进行中)
   */
  current_node_status?: '0' | '10' | '20' | '30' | '40' | '50'
}

// Important tasks (data-driven)
export interface ImportantTaskItem {
  id: string
  title: string
  description?: string
  actionText?: string
  closable?: boolean
  handleClick?: () => void
}

export async function fetchImportantTasks(): Promise<ImportantTaskItem[]> {
  // 预留后端接口；若无接口，则返回本地默认任务
  // try {
  //   const raw = await api.get('/talent/important_tasks')
  //   if (Array.isArray(raw)) return raw as ImportantTaskItem[]
  // } catch (_) {
  //   // ignore
  // }
  return [
    {
      id: 'guide',
      title: '一面千识使用须知',
      description: '请查看我们的用户手册',
      actionText: '去查看',
      closable: true,
      handleClick: () => {
        const url = 'https://dnu-cdn.xpertiise.com/common/366b8dd4-f449-4beb-b468-ad82f262362a.pdf'
        window.open(url, '_blank', 'noopener,noreferrer')
      },
    },
  ]
}

export function useImportantTasksQuery(
  options?: UseQueryOptions<ImportantTaskItem[]>
) {
  return useQuery({
    queryKey: ['importantTasks'],
    queryFn: fetchImportantTasks,
    ...options,
  })
}

// ===== 我的申请（分页） =====
export interface MyApplicationsParams {
  skip?: number
  limit?: number
}

export interface MyApplicationsResultRaw {
  data: ApiApplyListItem[]
  total: number
}

export async function fetchMyApplications(
  params: MyApplicationsParams = { skip: 0, limit: 10 }
): Promise<MyApplicationsResultRaw> {
  const { skip = 0, limit = 10 } = params
  const raw = await api.get('/talent/job_apply_list', {
    params: { skip, limit },
  })
  type Container = { data?: unknown; count?: unknown }
  const top = raw as Container
  const maybeNested = (top?.data ?? null) as Container | unknown[] | null
  const container: Container = Array.isArray(top?.data)
    ? (top as Container)
    : ((maybeNested as Container) ?? top)

  const listUnknown: unknown = container?.data ?? []
  const totalUnknown: unknown = container?.count ?? 0

  const list: ApiApplyListItem[] = Array.isArray(listUnknown)
    ? (listUnknown as ApiApplyListItem[])
    : []
  const total: number = typeof totalUnknown === 'number' ? totalUnknown : 0

  return {
    data: list,
    total,
  }
}

export function useMyApplicationsQuery(
  params: MyApplicationsParams,
  options?: UseQueryOptions<MyApplicationsResultRaw>
) {
  return useQuery({
    queryKey: ['my-applications', params],
    queryFn: () => fetchMyApplications(params),
    ...options,
  })
}

// ===== 我的申请（无限加载） =====
export type MyApplicationsPage = MyApplicationsResultRaw
export type UseInfiniteMyApplicationsResult = UseInfiniteQueryResult<InfiniteData<MyApplicationsPage>, Error>

export function useInfiniteMyApplicationsQuery(
  params: Omit<MyApplicationsParams, 'skip'> = { limit: 10 },
  options?: { enabled?: boolean }
): UseInfiniteMyApplicationsResult {
  const { limit = 10 } = params
  return useInfiniteQuery<MyApplicationsPage, Error, InfiniteData<MyApplicationsPage>, [string, { limit: number }], number>({
    queryKey: ['my-applications-infinite', { limit }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchMyApplications({ skip: pageParam * limit, limit }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const total = lastPage?.total ?? 0
      const currentPage = typeof lastPageParam === 'number' ? lastPageParam : 0
      const pageCount = total ? Math.max(1, Math.ceil(total / limit)) : undefined
      const hasMore = typeof pageCount === 'number' ? currentPage + 1 < pageCount : (lastPage?.data?.length ?? 0) === limit
      return hasMore ? currentPage + 1 : undefined
    },
    enabled: options?.enabled ?? true,
  })
}

interface ForHelpParams {
  detail: string
  need_contact: boolean
  phone_number: string
}

export async function fetchForHelp(params: ForHelpParams): Promise<null> {
  return await api.post('/interview/page/demand', params)
}
