import { api } from '@/lib/api'

export interface FeedbackParams {
  interview_id: number
  score: number
  feedback: string
}

export async function fetchFeedback(params: FeedbackParams): Promise<null> {
  return await api.post('/interview/feedback', params)
}
