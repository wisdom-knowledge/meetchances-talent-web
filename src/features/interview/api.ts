import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InterviewConnectionDetails {
  serverUrl: string
  token: string
  roomName?: string
  interviewId?: string | number
}

type UnknownRecord = Record<string, unknown>

function normalizeConnectionDetails(raw: unknown): InterviewConnectionDetails {
  const obj = (raw ?? {}) as UnknownRecord
  const serverUrl =
    (obj.serverUrl as string) ||
    (obj.server_url as string) ||
    (obj.livekit_server_url as string) ||
    (obj.livekitUrl as string) ||
    (obj.livekit_url as string) ||
    ''

  const token =
    (obj.token as string) ||
    (obj.participantToken as string) ||
    (obj.access_token as string) ||
    (obj.livekit_token as string) ||
    ''

  const roomName =
    (obj.roomName as string) || (obj.room_name as string) || (obj.room as string) || undefined

  const interviewId =
    (obj.interview_id as string | number) || (obj.interviewId as string | number) || undefined

  return { serverUrl, token, roomName, interviewId }
}

async function fetchInterviewConnectionDetails(jobId: string | number): Promise<InterviewConnectionDetails> {
  const raw = await api.get('/interview/connection-details', { params: { job_id: jobId } })
  return normalizeConnectionDetails(raw)
}

export function useInterviewConnectionDetails(jobId: string | number | null, enabled = true) {
  return useQuery({
    queryKey: ['interview-connection-details', jobId],
    queryFn: () => fetchInterviewConnectionDetails(jobId as string | number),
    enabled: Boolean(jobId) && enabled,
  })
}

export interface SupportDemandPayload {
  detail: string
  need_contact: boolean
  phone_number?: string
}

export async function submitInterviewSupportDemand(payload: SupportDemandPayload): Promise<{ success: boolean }> {
  try {
    await api.post('/interview/page/demand', payload)
    return { success: true }
  } catch (_e) {
    return { success: false }
  }
}

// 简历确认：POST /api/v1/talent/resume/confirm
export async function confirmResume(jobApplyId: number | string): Promise<{ success: boolean }> {
  try {
    await api.post('/talent/resume/confirm', { job_apply_id: jobApplyId })
    return { success: true }
  } catch (_e) {
    return { success: false }
  }
}


