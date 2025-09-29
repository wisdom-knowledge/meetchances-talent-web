import { api } from '@/lib/api'
import type { InterviewReportData } from './data/interview-report-types'
import { useAuthStore } from '@/stores/authStore'

export interface InterviewReportResponse {
  status_code: number
  status_msg: string
  data: InterviewReportData
}

export interface FetchInterviewReportParams {
  talentId?: number | string
  jobId?: number | string
}

export async function fetchInterviewReport({ talentId, jobId }: FetchInterviewReportParams): Promise<InterviewReportData> {
  try {
    const params: { talent_id?: number | string; job_id?: number | string } = {}
    // 优先使用传入的 talentId，否则尝试从 store 读取
    const user = useAuthStore.getState().auth.user
    params.talent_id = talentId ?? (user?.id as number | string | undefined)
    params.job_id = jobId
    const res = await api.get<InterviewReportData>('/talent/interview_report/fortalent', { params })
    return res as unknown as InterviewReportData
  } catch (_e) {
    return {} as InterviewReportData
  }
}


