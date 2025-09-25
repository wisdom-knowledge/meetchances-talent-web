import { api } from '@/lib/api'
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


