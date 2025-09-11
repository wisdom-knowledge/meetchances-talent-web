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
    retry: false,
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
  CompletedPendingReview = 20, // 已完成待审核
  Approved = 30, // 通过
  Rejected = 40, // 不通过
  Returned = 50, // 打回
}

export interface JobApplyProgressNode {
  node_name: string
  node_status: JobApplyNodeStatus
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
  id?: number | string
}

export interface JobApplyWorkflowResponse {
  job_apply_id?: number | string
  workflow_instance_id?: number | string
  workflow_status?: string
  current_node_id?: number | string
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

export function useJobApplyProgress(jobApplyId: string | number | null, enabled = true) {
  return useQuery<JobApplyWorkflowResponse, unknown, JobApplyProgressNode[]>({
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
        if (type === 'TRIAL_TASK' || key.toLowerCase().includes('task') || lowerName.includes('task')) return '测试任务'
        if (type === 'EDUCATION_VERIFY' || lowerName.includes('education')) return '学历验证'
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
      return backendNodes.map((n) => ({ node_name: normalizeName(n), node_status: normalizeStatus(n) }))
    },
  })
}


