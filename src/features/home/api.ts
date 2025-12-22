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
  job_detail: ApiJob & { 
    online_status?: number; // 岗位状态：20-暂停中，0-已关闭
    company?: { name?: string } 
  } // 岗位详细信息（扩展 online_status）
  progress: number // 当前进度
  total_step: number // 总步骤数
  /**
   * 当前申请的流程节点状态（字符串枚举）
   * '0': 未开始(视为进行中)
   * '10': 进行中
   * '20': 审核中
   * '30': 通过
   * '40': 未录取
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
  online_status?: number
}

export interface MyApplicationsResultRaw {
  data: ApiApplyListItem[]
  total: number
}

export async function fetchMyApplications(
  params: MyApplicationsParams = { skip: 0, limit: 10 }
): Promise<MyApplicationsResultRaw> {
  const { skip = 0, limit = 10, online_status } = params
  const raw = await api.get('/talent/job_apply_list', {
    params: { skip, limit, online_status },
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

type MyApplicationsQueryOptions = Omit<
  UseQueryOptions<MyApplicationsResultRaw, Error, MyApplicationsResultRaw, ['my-applications', MyApplicationsParams]>,
  'queryKey' | 'queryFn'
>

export function useMyApplicationsQuery(
  params: MyApplicationsParams,
  options?: MyApplicationsQueryOptions
) {
  return useQuery<MyApplicationsResultRaw, Error, MyApplicationsResultRaw, ['my-applications', MyApplicationsParams]>({
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
  const { limit = 10, online_status } = params
  return useInfiniteQuery<
    MyApplicationsPage,
    Error,
    InfiniteData<MyApplicationsPage>,
    [string, { limit: number; online_status?: number }],
    number
  >({
    queryKey: ['my-applications-infinite', { limit, online_status }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchMyApplications({ skip: pageParam * limit, limit, online_status }),
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

// ===== 我的项目列表 =====
export interface ProjectListItem {
  id: number
  title: string
  desc?: string
  created_at: number
  updated_at: number
  status?: number
  is_pinned?: boolean
}

export interface MyProjectsParams {
  skip?: number
  limit?: number
  status?: number
}

export interface MyProjectsResultRaw {
  data: ProjectListItem[]
  total: number
}

// 使用真实接口：GET /talent/projects
type BackendProjectItem = {
  id: number
  name?: string
  alias?: string
  introduction?: string
  description?: string
  status?: number
  is_pinned?: boolean
  created_at?: string | number
  updated_at?: string | number
}
type BackendProjectsResponse = {
  data?: BackendProjectItem[]
  count?: number
}

export async function fetchMyProjects(
  params: MyProjectsParams = { skip: 0, limit: 10 }
): Promise<MyProjectsResultRaw> {
  const { skip = 0, limit = 10, status } = params

  const res = (await api.get('/talent/projects', {
    params: { skip, limit, status },
  })) as unknown as BackendProjectsResponse

  const items: BackendProjectItem[] = Array.isArray(res?.data) ? res.data : []
  const total: number = typeof res?.count === 'number' ? res.count : 0

  const toSeconds = (value: string | number | undefined): number => {
    if (typeof value === 'number') {
      // 兼容毫秒级：判断是否远大于秒级
      return value > 1e12 ? Math.floor(value / 1000) : value
    }
    if (typeof value === 'string' && value) {
      const t = Date.parse(value)
      if (!Number.isNaN(t)) return Math.floor(t / 1000)
    }
    return Math.floor(Date.now() / 1000)
  }

  const list: ProjectListItem[] = items.map((p) => ({
    id: p.id,
    title: (p.alias?.trim() || p.name?.trim() || '').trim(),
    desc: (p.introduction?.trim() || p.description?.trim() || '').trim() || undefined,
    created_at: toSeconds(p.created_at),
    updated_at: toSeconds(p.updated_at),
    status: p.status,
    is_pinned: p.is_pinned,
  }))

  return { data: list, total }
}

type MyProjectsQueryOptions = Omit<
  UseQueryOptions<MyProjectsResultRaw, Error, MyProjectsResultRaw, ['my-projects', MyProjectsParams]>,
  'queryKey' | 'queryFn'
>

export function useMyProjectsQuery(
  params: MyProjectsParams,
  options?: MyProjectsQueryOptions
) {
  return useQuery<MyProjectsResultRaw, Error, MyProjectsResultRaw, ['my-projects', MyProjectsParams]>({
    queryKey: ['my-projects', params],
    queryFn: () => fetchMyProjects(params),
    ...options,
  })
}

// ===== 我的项目（无限加载） =====
export type MyProjectsPage = MyProjectsResultRaw
export type UseInfiniteMyProjectsResult = UseInfiniteQueryResult<InfiniteData<MyProjectsPage>, Error>

export function useInfiniteMyProjectsQuery(
  params: Omit<MyProjectsParams, 'skip'> = { limit: 10 },
  options?: { enabled?: boolean }
): UseInfiniteMyProjectsResult {
  const { limit = 10, status } = params
  return useInfiniteQuery<
    MyProjectsPage,
    Error,
    InfiniteData<MyProjectsPage>,
    [string, { limit: number; status?: number }],
    number
  >({
    queryKey: ['my-projects-infinite', { limit, status }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchMyProjects({ skip: pageParam * limit, limit, status }),
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

// ===== 置顶项目（单条，数组形式返回，最多 1 条） =====
export interface TopProjectItem extends ProjectListItem {
  introduction?: string
  is_pinned?: boolean
  estimated_duration?: number // 分钟
  start_time?: number // 秒时间戳
  end_time?: number // 秒时间戳
  price_per_unit?: number
  unit?: number
}

type BackendTopProjectItem = BackendProjectItem & {
  introduction?: string
  is_pinned?: boolean
  estimated_duration?: number
  start_time?: string | number
  end_time?: string | number
  price_per_unit?: number
  unit?: number
}

export async function fetchTopProjects(): Promise<TopProjectItem[]> {
  // 兼容不同返回结构：可能是 { data: [...] } 或 { data: { data: [...], count } }
  try {
    const raw = (await api.get('/talent/projects/pinned/top')) as unknown as {
      data?: unknown
      status_code?: number
      status_msg?: string
    }

    const maybeNested = raw?.data as { data?: unknown } | unknown[] | undefined
    const arr = Array.isArray(maybeNested)
      ? (maybeNested as BackendTopProjectItem[])
      : (Array.isArray((maybeNested as { data?: unknown })?.data)
          ? ((maybeNested as { data?: unknown })?.data as BackendTopProjectItem[])
          : Array.isArray((raw as unknown as { data?: BackendTopProjectItem[] })?.data)
            ? ((raw as unknown as { data?: BackendTopProjectItem[] })?.data as BackendTopProjectItem[])
            : [])

    const items: BackendTopProjectItem[] = Array.isArray(arr) ? arr : []
    if (!items.length) return []

    const toSeconds = (value: string | number | undefined): number | undefined => {
      if (value === undefined) return undefined
      if (typeof value === 'number') {
        return value > 1e12 ? Math.floor(value / 1000) : value
      }
      if (typeof value === 'string' && value) {
        const t = Date.parse(value)
        if (!Number.isNaN(t)) return Math.floor(t / 1000)
      }
      return undefined
    }

    return items.map((p) => ({
      id: p.id,
      title: (p.alias?.trim() || p.name?.trim() || '').trim(),
      created_at: toSeconds(p.start_time) ?? toSeconds(p.created_at) ?? Math.floor(Date.now() / 1000),
      updated_at: toSeconds(p.updated_at) ?? Math.floor(Date.now() / 1000),
      introduction: p.introduction,
      is_pinned: p.is_pinned ?? false,
      estimated_duration: p.estimated_duration,
      start_time: toSeconds(p.start_time),
      end_time: toSeconds(p.end_time),
      price_per_unit: p.price_per_unit,
      unit: p.unit,
    }))
  } catch {
    // 请求失败时返回空数组
    return []
  }
}

export function useTopProjectsQuery(options?: UseQueryOptions<TopProjectItem[]>) {
  return useQuery({
    queryKey: ['top-projects'],
    queryFn: fetchTopProjects,
    ...options,
  })
}