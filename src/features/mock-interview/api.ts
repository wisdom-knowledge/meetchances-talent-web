import { api } from '@/lib/api'
import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query'
import type { BackendMockJobsData, MockInterviewListParams, MockInterviewItem, MockCategoryItem, MockInterviewRecordsResponse } from './types'

export async function fetchMockInterviewList(params: MockInterviewListParams = {
  skip: 0, limit: 9,
  q: undefined
}): Promise<BackendMockJobsData> {
  try {
    const skip = Math.max(0, Number(params.skip ?? 0))
    const limit = Math.max(1, Number(params.limit ?? 9))
    const name = (params.name ?? params.q ?? '').trim() || undefined
    const category_id = params.category_id
    const res = await api.get<BackendMockJobsData>('/jobs/mock', {
      params: { skip, limit, name, category_id },
    })

    // 由于拦截器已解包，这里的 res 就是 { items, count }
    return res as unknown as BackendMockJobsData
  } catch (_e) {
    return { items: [], count: 0 }
  }
}

// 分类列表：/jobs/classify/list
export async function fetchMockCategories(): Promise<MockCategoryItem[]> {
  try {
    const res = await api.get('/jobs/classify/list')
    if (Array.isArray(res)) return res as MockCategoryItem[]
    return []
  } catch {
    return []
  }
}

// 记录列表（mock）：与列表结构类似，包含 status 与时间等元信息
export interface MockRecordItem extends MockInterviewItem {
  interviewedAt: string
  status: 'completed' | 'pending' | 'failed'
  reportReady: boolean
}

export async function fetchMockInterviewRecords(params: MockInterviewListParams = {
  skip: 0,
  limit: 10,
  q: undefined,
}): Promise<MockInterviewRecordsResponse> {
  try {
    const skip = Math.max(0, Number(params.skip ?? 0))
    const limit = Math.max(1, Number(params.limit ?? 10))
    const res = await api.get<MockInterviewRecordsResponse>('/talent/mock/interview/records', { params: { skip, limit } })
    return res as unknown as MockInterviewRecordsResponse
  } catch (_e) {
    return { items: [], count: 0 }
  }
}

// --- Infinite Query for Mock Interview List ---
export type MockListPage = BackendMockJobsData // { items: BackendMockJobItem[]; count: number }

export type UseInfiniteMockInterviewListResult = UseInfiniteQueryResult<InfiniteData<MockListPage>, Error>

export function useInfiniteMockInterviewList(
  params: Omit<MockInterviewListParams, 'skip'> & { category_id?: number } = {
    limit: 12,
    q: undefined,
  },
  options?: { enabled?: boolean }
): UseInfiniteMockInterviewListResult {
  const { limit = 12, name, category_id, q } = params

  return useInfiniteQuery<MockListPage, Error, InfiniteData<MockListPage>, [string, { limit: number; name?: string; category_id?: number; q?: string }], number>({
    queryKey: ['mock-interview-infinite', { limit, name, category_id, q }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const skip = pageParam * limit
      const res = await fetchMockInterviewList({ skip, limit, name, category_id, q })
      return res
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const total = lastPage?.count ?? 0
      const currentPage = typeof lastPageParam === 'number' ? lastPageParam : 0
      const pageCount = total ? Math.max(1, Math.ceil(total / limit)) : undefined
      const hasMore = typeof pageCount === 'number' ? currentPage + 1 < pageCount : (lastPage?.items?.length ?? 0) === limit
      return hasMore ? currentPage + 1 : undefined
    },
    enabled: options?.enabled ?? true,
  })
}

// --- Infinite Query for Mock Interview Records ---
export type MockRecordsPage = MockInterviewRecordsResponse
export type UseInfiniteMockInterviewRecordsResult = UseInfiniteQueryResult<InfiniteData<MockRecordsPage>, Error>

export function useInfiniteMockInterviewRecords(
  params: { limit?: number } = { limit: 10 },
  options?: { enabled?: boolean }
): UseInfiniteMockInterviewRecordsResult {
  const { limit = 10 } = params

  return useInfiniteQuery<MockRecordsPage, Error, InfiniteData<MockRecordsPage>, [string, { limit: number }], number>({
    queryKey: ['mock-interview-records-infinite', { limit }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const skip = pageParam * limit
      const res = await fetchMockInterviewRecords({ skip, limit, q: undefined })
      return res
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const total = lastPage?.count ?? 0
      const currentPage = typeof lastPageParam === 'number' ? lastPageParam : 0
      const pageCount = total ? Math.max(1, Math.ceil(total / limit)) : undefined
      const hasMore = typeof pageCount === 'number' ? currentPage + 1 < pageCount : (lastPage?.items?.length ?? 0) === limit
      return hasMore ? currentPage + 1 : undefined
    },
    enabled: options?.enabled ?? true,
  })
}


