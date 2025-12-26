import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import logger from '@/utils/logger'

// ===== 类型定义（顶部集中管理） =====
export interface BackendProject {
  id: number
  name?: string
  alias?: string
  status?: number
  project_type?: number
  price_per_unit?: number
  unit?: number
  settlement_time?: string
  settlement_condition?: string
  questionnaire_url?: string
  work_guide?: string
  trial_group_url?: string
  require_payment_binding?: boolean
  require_data_agreement?: boolean
  require_feishu_binding?: boolean
  trial_task_id?: number
  new_user_settlement_priority?: number
  created_at?: string
  updated_at?: string
  project_personnel_count?: number
}

export interface BackendPersonalInfo {
  has_feishu?: boolean
  has_read_agreement?: boolean
  miniprogram_openid?: string
}

export interface TalentProjectDetail {
  project?: BackendProject
  personal_info?: BackendPersonalInfo
}

// 飞书授权 URL
export interface TalentAuthURL {
  auth_url: string
  expires_in: number
}

// ===== API =====
// 获取项目详情（直接返回后端原始结构）
export async function getProjectDetail(projectId: number): Promise<TalentProjectDetail> {
  const res = await api.get(`/talent/projects/${projectId}`)
  return res as unknown as TalentProjectDetail
}

// 更新协议状态
export async function bindDataAgreement(projectId: number): Promise<void> {
  try {
    await api.patch('/talent/projects/agreement-status', {
      project_id: projectId,
      has_read_agreement: true,
    })
  } catch (error) {
    logger.error('绑定数据协议失败:', error)
    throw error
  }
}

// ===== Hooks =====
export function useProjectDetail(projectId: number, enabled = true) {
  return useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: () => getProjectDetail(projectId),
    enabled,
  })
}

// 获取飞书授权 URL
export async function fetchTalentAuthURL(): Promise<TalentAuthURL> {
  // 拦截器已解包，直接返回 data：{ auth_url, expires_in }
  const res = await api.get('/talent/get-auth-url')
  return res as unknown as TalentAuthURL
}

export function useTalentAuthURL(enabled = true) {
  return useQuery({
    queryKey: ['feishu-auth-url'],
    queryFn: fetchTalentAuthURL,
    enabled,
    refetchOnWindowFocus: false,
  })
}

