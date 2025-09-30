export interface MockInterviewItem {
  interview_id: number
  title: string
  summary: string
  durationMinutes: number
  category: string
  category_id: number
  id: number
}

export interface MockInterviewListParams {
  q: string | undefined
  // 前端检索参数
  name?: string
  category_id?: number
  skip?: number
  limit?: number
}

export interface MockInterviewListResult {
  success: boolean
  data: MockInterviewItem[]
  total: number
}

// 后端返回结构
export interface BackendMockJobItem {
  id: number
  title: string
  description: string
  interview_duration_minutes: number
  category_id: number
  category_name: string
  online_status: number
  workflow_template_id: number
  workflow_template: { template_def: unknown; id: number; created_at: string; updated_at: string }
  created_at: string
  updated_at: string
}

export interface BackendMockJobsData {
  items: BackendMockJobItem[]
  count: number
}

export interface MockRecordItem extends MockInterviewItem {
  interviewedAt: string
  status: 'completed' | 'pending' | 'failed'
  reportReady: boolean
}

// --- Records API transparent types ---
export interface MockInterviewRecordApiItem {
  job_id?: number
  job_apply_id?: number | string
  job_title: string
  interview_duration_minutes: number
  status: number | string
  applied_at: string
}

export interface MockInterviewRecordsResponse {
  items: MockInterviewRecordApiItem[]
  count: number
}

// 分类
export interface MockCategoryItem {
  category_id: number
  category_name: string
  image?: string
}


