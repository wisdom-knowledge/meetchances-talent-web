import { useQuery, useInfiniteQuery, type UseQueryOptions, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface JobsListParams {
  skip?: number
  limit?: number
  sort_by?: JobsSortBy
  sort_order?: JobsSortOrder
  title?: string
  /**
   * 是否仅返回“可内推岗位”（具备内推简历的岗位，后端筛选）
   */
  referral_only?: boolean
}

export enum JobsSortBy {
  PublishTime = 'publish_time',
  SalaryMax = 'salary_max',
  ReferralBonus = 'referral_bonus',
}

export enum JobsSortOrder {
  Desc = 'desc',
  Asc = 'asc',
}

export interface JobsListResponse<TItem> {
  items?: TItem[]
  total?: number
}

export type ApiJob = {
  id: number | string
  title: string
  description: string
  job_type: 'full_time' | 'part_time' | 'mock_job'
  salary_type: 'hour' | 'month' | 'year' | string
  salary_min: number
  salary_max: number
  referral_bonus?: number
  campaign?: {
    name: string
    project_id?: number
    status: 'ACTIVE' | 'ENDED'
    type: 'referral_reward' | 'full_order_reward'
    start_date?: string
    end_date?: string
    condition_type: 'pass_questions' | 'complete_working_hours'
    quantity?: number
    reward?: string
    id: number
    created_at: string
    updated_at: string
  }
  project?: {
    id?: number
    alias?: string
    name?: string
  }
  online_status?: number
  start_date?: string
  end_date?: string
  workflow_template_id?: number
  talent_profile?: string
  company_id?: number
  company?: {
    id?: number
    name?: string
    description?: string
  }
  workflow_template?: {
    id?: number
    created_at?: string
    updated_at?: string
    template_def?: unknown
  }
  created_at?: string
  updated_at?: string
  /**
   * 模拟面试时长（分钟）。仅当 job_type 为 'MOCK_JOB' 时可能存在。
   */
  interview_duration_minutes?: number
}

async function fetchJobs(
  params: JobsListParams = {
    skip: 0,
    limit: 20,
    sort_by: JobsSortBy.PublishTime,
    sort_order: JobsSortOrder.Desc,
  }
): Promise<{ data: ApiJob[]; total?: number }> {
  const {
    skip = 0,
    limit = 20,
    sort_by = JobsSortBy.PublishTime,
    sort_order = JobsSortOrder.Desc,
    title,
    referral_only,
  } = params
  const raw = await api.get(`/jobs/`, {
    params: {
      skip,
      limit,
      sort_by,
      sort_order,
      ...(title ? { title } : {}),
      ...(typeof referral_only === 'boolean' ? { referral_only } : {}),
    },
  })
  // API may return array或 {items,total}; 这里做兼容
  if (Array.isArray(raw)) {
    return { data: raw as ApiJob[] }
  }
  const maybe: { items?: ApiJob[]; total?: number; count?: number } =
    raw as unknown as {
      items?: ApiJob[]
      total?: number
      count?: number
    }
  if (maybe && Array.isArray(maybe.items)) {
    return { data: maybe.items as ApiJob[], total: maybe.total ?? maybe.count }
  }
  return { data: [] }
}

export type JobsPage = { data: ApiJob[]; total?: number }

type JobsQueryOptions = Omit<
  UseQueryOptions<JobsPage, Error, JobsPage, ['jobs', JobsListParams]>,
  'queryKey' | 'queryFn'
>

export function useJobsQuery(
  params: JobsListParams = {
    skip: 0,
    limit: 20,
    sort_by: JobsSortBy.PublishTime,
    sort_order: JobsSortOrder.Desc,
  },
  options?: JobsQueryOptions
) {
  return useQuery<JobsPage, Error, JobsPage, ['jobs', JobsListParams]>({
    queryKey: ['jobs', params],
    queryFn: () => fetchJobs(params),
    ...options,
  })
}

/**
 * 基于 skip/limit 的无限加载查询
 * - pageParam 表示第几页（从 0 开始），内部换算为 skip = pageParam * limit
 * - 是否还有下一页：优先根据 total 判断；无 total 时以 data.length === limit 作为启发
 */
export type UseInfiniteJobsResult = UseInfiniteQueryResult<InfiniteData<JobsPage>, Error>

export function useInfiniteJobsQuery(
  params: Omit<JobsListParams, 'skip'> = {
    limit: 20,
    sort_by: JobsSortBy.PublishTime,
    sort_order: JobsSortOrder.Desc,
  },
  options?: { enabled?: boolean }
): UseInfiniteJobsResult {
  const { limit = 20, sort_by = JobsSortBy.PublishTime, sort_order = JobsSortOrder.Desc, title, referral_only } = params

  return useInfiniteQuery<JobsPage, Error, InfiniteData<JobsPage>, [string, Omit<JobsListParams, 'skip'>], number>({
    queryKey: ['jobs-infinite', { limit, sort_by, sort_order, title, referral_only }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchJobs({
        skip: pageParam * limit,
        limit,
        sort_by,
        sort_order,
        title,
        referral_only,
      }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const total = lastPage.total
      const currentPage = typeof lastPageParam === 'number' ? lastPageParam : 0
      const pageCount = total ? Math.max(1, Math.ceil(total / limit)) : undefined
      const hasMore = typeof pageCount === 'number' ? currentPage + 1 < pageCount : lastPage.data.length === limit
      return hasMore ? currentPage + 1 : undefined
    },
    enabled: options?.enabled ?? true,
  })
}

async function fetchJobDetail(id: string | number): Promise<ApiJob> {
  const data = (await api.get(`/jobs/${id}`)) as unknown as ApiJob
  return data
}

export function useJobDetailQuery(
  id: string | number | null,
  enabled = true,
  options?: UseQueryOptions<ApiJob>
) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJobDetail(id as string | number),
    enabled: Boolean(id) && enabled,
    ...options,
  })
}

export async function applyJob(
  jobId: string | number,
  inviteToken: string
): Promise<number | string | null> {
  const res = await api.post('/talent/apply_job', {
    job_id: jobId,
    invite_token: inviteToken,
  })
  const payload = (res as { data?: unknown })?.data ?? res
  const jobApplyId = (payload as { job_apply_id?: number | string })
    ?.job_apply_id
  return typeof jobApplyId === 'number' || typeof jobApplyId === 'string'
    ? jobApplyId
    : null
}

export enum InviteTokenType {
  ActiveApply = 2,
}

export interface GenerateInviteTokenPayload {
  job_id: string | number
  token_type: InviteTokenType
}

export async function generateInviteToken(
  payload: GenerateInviteTokenPayload
): Promise<string | null> {
  const res = await api.post('/jobs/gen_invite_token', payload)

  if (typeof res === 'string') return res
  const token = (res as { invite_token?: string })?.invite_token
  return token ?? null
}

// --- Job Apply Status ---
export enum JobApplyStatus {
  NotApplied = 0,
  Applied = 10,
}

export interface JobApplyStatusItem {
  job_apply_id: number | string
  job_apply_status: JobApplyStatus
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
  progress: number
  total_step: number
}

export type JobApplyStatusMap = Record<string, JobApplyStatusItem>

export async function fetchJobApplyStatus(
  jobIds: Array<string | number>
): Promise<JobApplyStatusMap> {
  const ids = (jobIds || []).map((v) => String(v)).filter(Boolean)
  if (!ids.length) return {}
  const res = await api.get('/talent/job_apply_status', {
    params: { job_ids: ids.join(',') },
  })
  const data = (res as { data?: unknown })?.data ?? res
  const map = (data as unknown as Record<string, unknown>) || {}
  const result: JobApplyStatusMap = {}
  for (const [k, v] of Object.entries(map)) {
    const obj = (v ?? {}) as {
      job_apply_id?: number | string
      job_apply_status?: number | string
      current_node_status?: string | number
      progress?: number
      total_step?: number
    }
    const statusNum =
      typeof obj.job_apply_status === 'number'
        ? obj.job_apply_status
        : parseInt(String(obj.job_apply_status ?? '0'), 10)
    result[k] = {
      job_apply_id:
        typeof obj.job_apply_id === 'number' ||
          typeof obj.job_apply_id === 'string'
          ? obj.job_apply_id
          : 0,
      job_apply_status: statusNum as JobApplyStatus,
      current_node_status:
        typeof obj.current_node_status === 'string' ||
          typeof obj.current_node_status === 'number'
          ? (String(
            obj.current_node_status
          ) as JobApplyStatusItem['current_node_status'])
          : undefined,
      progress: typeof obj.progress === 'number' ? obj.progress : 0,
      total_step: typeof obj.total_step === 'number' ? obj.total_step : 0,
    }
  }
  return result
}

export function useJobApplyStatus(
  jobIds: Array<string | number> | null,
  enabled = true
) {
  const key = Array.isArray(jobIds)
    ? jobIds.map((v) => String(v)).join(',')
    : ''
  return useQuery<JobApplyStatusMap>({
    queryKey: ['job-apply-status', key, jobIds],
    queryFn: () =>
      fetchJobApplyStatus((jobIds as Array<string | number>) || []),
    enabled: Boolean(jobIds && jobIds.length > 0) && enabled,
    staleTime: 10_000,
  })
}
