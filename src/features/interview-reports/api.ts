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

export async function fetchInterviewReport({ talentId, jobId }: FetchInterviewReportParams): Promise<InterviewReportResponse> {
  try {
    const params: { talent_id?: number | string; job_id?: number | string } = {}
    // 优先使用传入的 talentId，否则尝试从 store 读取
    const user = useAuthStore.getState().auth.user
    params.talent_id = talentId ?? (user?.id as number | string | undefined)
    params.job_id = jobId
    const res = await api.get<InterviewReportResponse>('/talent/interview_report/fortalent', { params })
    return res as unknown as InterviewReportResponse
  } catch (_e) {
    return { status_code: -1, status_msg: 'error', data: {
      title: '',
      overall_score: { score: 0, full_mark: 100, reason: '' },
      applicant_brief: '',
      education_brief: '',
      experience_brief: '',
      ai_interview: { section_score: { score: 0, full_mark: 100, reason: '' }, detail_text: [], section_scores: [] },
      resume_match: { section_score: { score: 0, full_mark: 100, reason: [] }, extra_info: {}, video_url: '', avatar_url: '' },
      poster_info: { name: '', jobName: '' },
    } as InterviewReportData }
  }
}


