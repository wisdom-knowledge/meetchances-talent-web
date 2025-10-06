import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InterviewConnectionDetails {
  serverUrl: string
  token: string
  roomName?: string
  interviewId?: string | number
}

type UnknownRecord = Record<string, unknown>

export function normalizeConnectionDetails(raw: unknown): InterviewConnectionDetails {
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

export async function fetchInterviewConnectionDetails(jobId: string | number): Promise<InterviewConnectionDetails> {
  const raw = await api.get('/interview/connection-details', { params: { job_id: jobId } })
  return normalizeConnectionDetails(raw)
}

export function useInterviewConnectionDetails(jobId: string | number | null, enabled = true) {
  return useQuery({
    queryKey: ['interview-connection-details', jobId],
    queryFn: () => fetchInterviewConnectionDetails(jobId as string | number),
    enabled: Boolean(jobId) && enabled,
    retry: false,
  })
}

// LocalStorage helpers for interview connection details
export const INTERVIEW_CONN_STORAGE_PREFIX = 'interview:connection:v1:'

export function makeInterviewConnStorageKey(interviewId: string | number): string {
  return `${INTERVIEW_CONN_STORAGE_PREFIX}${String(interviewId)}`
}

export function saveInterviewConnectionToStorage(details: InterviewConnectionDetails): void {
  try {
    const interviewId = details?.interviewId
    if (interviewId == null) return
    const key = makeInterviewConnStorageKey(interviewId)
    const json = JSON.stringify(details)
    window.localStorage.setItem(key, json)
  } catch (_e) {
    // ignore storage errors (e.g., private mode)
  }
}

export function loadInterviewConnectionFromStorage(interviewId: string | number): InterviewConnectionDetails | null {
  try {
    const key = makeInterviewConnStorageKey(interviewId)
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return normalizeConnectionDetails(parsed)
  } catch (_e) {
    return null
  }
}

export function removeInterviewConnectionFromStorage(interviewId: string | number): void {
  try {
    const key = makeInterviewConnStorageKey(interviewId)
    window.localStorage.removeItem(key)
  } catch (_e) {
    // ignore storage errors (e.g., private mode)
  }
}

// Interview record status
export interface InterviewRecordStatusData {
  status: number
  egress_list?: unknown[]
}

export async function fetchInterviewRecordStatus(roomName: string): Promise<InterviewRecordStatusData> {
  const raw = await api.get('/talent/interview_record_status', { params: { room_name: roomName } })
  // interceptor already unwraps { status_code, data }
  const obj = (raw ?? {}) as unknown as UnknownRecord
  const status = typeof obj.status === 'number' ? obj.status : parseInt(String(obj.status ?? '0'), 10)
  const egress_list = (obj.egress_list as unknown[]) || []
  return { status, egress_list }
}

export function useInterviewRecordStatus(
  roomName: string | undefined,
  enabled = true,
  refetchInterval: number | false = 5000,
) {
  return useQuery<InterviewRecordStatusData>({
    queryKey: ['interview-record-status', roomName],
    queryFn: () => fetchInterviewRecordStatus(roomName as string),
    enabled: Boolean(roomName) && enabled,
    staleTime: 2000,
    refetchInterval,
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


// Job apply progress
export enum JobApplyNodeStatus {
  NotStarted = 0, // 待开始
  InProgress = 10, // 已开始未完成
  AnnotateCompleted = 15, // 待标注端审核
  CompletedPendingReview = 20, // 已完成待审核
  Approved = 30, // 通过
  Rejected = 40, // 不通过
  Returned = 50, // 打回
}

export interface JobApplyProgressNode {
  node_name: string
  node_status: JobApplyNodeStatus
  id: number
}

// (mock constants removed)

// (legacy type removed)

// (legacy backend response type removed in favor of JobApplyWorkflowResponse)

// (removed) old fetchJobApplyProgress in favor of workflow-based selector

// Expose raw workflow with node ids for callers that need node_id
export interface JobApplyWorkflowNode {
  node_type?: string
  node_key?: string
  node_name?: string
  status?: number | string
  id: number
}

export interface JobApplyWorkflowResponse {
  job_apply_id?: number | string
  workflow_instance_id?: number | string
  workflow_status?: string
  current_node_id?: number
  nodes?: JobApplyWorkflowNode[]
}

export async function fetchJobApplyWorkflow(jobApplyId: string | number): Promise<JobApplyWorkflowResponse> {
  const raw = await api.get('/talent/job_apply_progress', { params: { job_apply_id: jobApplyId } })
  return raw as unknown as JobApplyWorkflowResponse
}

export function useJobApplyWorkflow(jobApplyId: string | number | null, enabled = true) {
  return useQuery<JobApplyWorkflowResponse>({
    queryKey: ['job-apply-workflow', jobApplyId],
    queryFn: () => fetchJobApplyWorkflow(jobApplyId as string | number),
    enabled: Boolean(jobApplyId) && enabled,
    staleTime: 30_000,
    refetchOnMount: false,
  })
}

// Helper: get INTERVIEW node id from workflow
export function getInterviewNodeId(workflow?: JobApplyWorkflowResponse | null): string | number | undefined {
  if (!workflow) return undefined
  const nodes: JobApplyWorkflowNode[] = Array.isArray(workflow.nodes) ? workflow.nodes : []
  const isInterviewLike = (n: JobApplyWorkflowNode): boolean => {
    const type = String(n?.node_type ?? '').toUpperCase()
    const key = String(n?.node_key ?? '')
    const name = String(n?.node_name ?? '')
    const lower = `${key} ${name}`.toLowerCase()
    return (
      type === 'INTERVIEW' ||
      key === 'Interview' ||
      lower.includes('interview') ||
      name.includes('面试')
    )
  }
  const hit = nodes.find((n) => isInterviewLike(n))
  if (hit?.id != null) return hit.id
  if (workflow.current_node_id != null) return workflow.current_node_id
  return undefined
}

// Node action API
export enum NodeActionTrigger {
  Start = 'start',
  Submit = 'submit',
  Approve = 'approve',
  Reject = 'reject',
  SendBack = 'send_back',
  Restart = 'restart',
  Retake = 'retake'
}

export interface NodeActionPayload {
  node_id: number | string
  trigger: NodeActionTrigger
  result_data?: Record<string, unknown>
}

export async function postNodeAction(payload: NodeActionPayload): Promise<{ success: boolean }> {
  try {
    const body = {
      node_id: payload.node_id,
      trigger: String(payload.trigger),
      result_data: payload.result_data ?? {},
    }
    await api.post('/talent/node/action', body, {
      headers: { 'Content-Type': 'application/json' },
    })
    return { success: true }
  } catch (_e) {
    return { success: false }
  }
}

export interface JobApplyProgressResult {
  current_node_id?: number | string
  nodes: JobApplyProgressNode[]
}

export function useJobApplyProgress(jobApplyId: string | number | null, enabled = true) {
  return useQuery<JobApplyWorkflowResponse, unknown, JobApplyProgressResult>({
    queryKey: ['job-apply-workflow', jobApplyId],
    queryFn: () => fetchJobApplyWorkflow(jobApplyId as string | number),
    enabled: Boolean(jobApplyId) && enabled,
    staleTime: 30_000,
    refetchOnMount: false,
    select: (obj) => {
      const backendNodes = Array.isArray(obj?.nodes) ? obj.nodes! : []
      const normalizeName = (n: JobApplyWorkflowNode): string => {
        const type = String(n.node_type ?? '')
        const key = String(n.node_key ?? '')
        const name = String(n.node_name ?? '')
        const lowerName = name.toLowerCase()
        if (type === 'INTERVIEW' || key === 'Interview' || lowerName.includes('interview')) return 'AI 面试'
        if (type === 'RESUME_CHECK' || key === 'ResumeCheck' || lowerName.includes('resume')) return '简历分析'
        if (type === 'ANNOTATE_TEST' || key === 'AnnotateTest' || lowerName.includes('annotate')) return '测试任务'
        if (type === 'EDUCATION_VERIFY' || lowerName.includes('education')) return '学历验证'
        if (type === 'SURVEY' || key === 'Survey' || lowerName.includes('survey')) return '问卷收集'
        return name || key || '—'
      }
      const normalizeStatus = (n: JobApplyWorkflowNode): JobApplyNodeStatus => {
        const rawStatus = n.status
        const num = typeof rawStatus === 'number' ? rawStatus : parseInt(String(rawStatus ?? '0'), 10)
        switch (num) {
          case 0:
            return JobApplyNodeStatus.NotStarted
          case 10:
            return JobApplyNodeStatus.InProgress
          case 15:
            return JobApplyNodeStatus.AnnotateCompleted
          case 20:
            return JobApplyNodeStatus.CompletedPendingReview
          case 30:
            return JobApplyNodeStatus.Approved
          case 40:
            return JobApplyNodeStatus.Rejected
          case 50:
            return JobApplyNodeStatus.Returned
          default:
            return JobApplyNodeStatus.NotStarted
        }
      }
      const nodes = backendNodes.map((n) => ({ ...n, node_name: normalizeName(n), node_status: normalizeStatus(n) }))
      return { current_node_id: obj?.current_node_id, nodes }
    },
  })
}

/**
 * 获取 RTC 连接信息
 * @param params 
 * @returns 
 */
// (removed duplicate getRtcConnectionInfo)


/**
 * 开始语音聊天
 * @param params 
 * @returns 
 */
export async function startVoiceChat(params: { room_id: string }) {
  return api.post('/talent/start-voice-chat', params)
}

/**
 * 停止语音聊天
 * @param params 
 * @returns 
 */
export async function stopVoiceChat(params: { room_name: string }) {
  return api.post('/talent/stop-voice-chat', params)
}

// Volc RTC
export interface RtcConnectionInfoResponse {
  token: string
  room_id: string
  user_id: string
  server_url: string
  expire_at: number
  interview_id: number
  room_name: string
}

export async function getRtcConnectionInfo(params: { job_id: number }): Promise<RtcConnectionInfoResponse> {
  const raw = await api.post('/talent/vol-rtc-connection', params)
  return raw as unknown as RtcConnectionInfoResponse
}
