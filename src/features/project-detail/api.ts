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
  require_payment_binding?: boolean
  require_data_agreement?: boolean
  require_feishu_binding?: boolean
  trial_task_id?: number
  new_user_settlement_priority?: number
  created_at?: string
  updated_at?: string
  project_personnel_count?: number
  trial_group_url?: string
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

// ===== 项目综合评分（真实接口）=====
export interface ProjectScoreStats {
  /**
   * 得分分布：数组 6 个元素分别对应 1/2/2.5/3/4/5 分的数量
   */
  score_distribution: number[]
  /**
   * 已批准金额总数（用于“此项目至今已赚”）
   */
  approved_amount: number
  /**
   * 项目综合评分
   */
  average_score: number
  /**
   * 累计任务数（当前页面不展示）
   */
  total_tasks: number
  /**
   * 初审通过率（0~1）
   * 示例：0.36 => 36%
   */
  first_review_pass_rate: number
}

// 飞书授权 URL
export interface TalentAuthURL {
  auth_url: string
  expires_in: number
}

// 飞书应用鉴权信息（用于 Web Components）
export interface FeishuAppAuth {
  app_id: string
  signature?: string // 签名（使用签名验证时需要）
  timestamp?: number // 时间戳（毫秒，使用签名验证时需要）
  noncestr?: string // 随机字符串（使用签名验证时需要）
  url?: string // 参与签名加密计算的url（使用签名验证时需要）
  doc_token?: string // 文档 token
  ticket?: string // 票据（使用 app_access_token 时需要）
  app_access_token?: string // 应用访问令牌（使用 app_access_token 时需要）
  expires_in: number // 过期时间（秒）
}

// ===== API =====
// 获取项目详情（直接返回后端原始结构）
export async function getProjectDetail(projectId: number): Promise<TalentProjectDetail> {
  const res = await api.get(`/talent/projects/${projectId}`)
  return res as unknown as TalentProjectDetail
}

// 获取项目综合评分（真实接口）
export async function getProjectStats(projectId: number): Promise<ProjectScoreStats> {
  const res = await api.get(`/talent/projects/${projectId}/score-stats`)
  return res as unknown as ProjectScoreStats
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

export function useProjectStats(projectId: number, enabled = true) {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => getProjectStats(projectId),
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

// 获取飞书应用鉴权信息（用于 Web Components）
export async function fetchFeishuAppAuth(docToken?: string, url?: string): Promise<FeishuAppAuth> {
  const params: Record<string, string> = {}
  if (docToken) {
    params.doc_token = docToken
  }
  if (url) {
    params.url = url
  }
  const res = await api.get('/talent/feishu/app-auth', { params: Object.keys(params).length > 0 ? params : undefined })
  return res as unknown as FeishuAppAuth
}

export function useFeishuAppAuth(enabled = true, docToken?: string, url?: string) {
  return useQuery({
    queryKey: ['feishu-app-auth', docToken, url],
    queryFn: () => fetchFeishuAppAuth(docToken, url),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // 每次进入页面都重新请求
    refetchOnReconnect: false,
    staleTime: 0, // 不使用缓存，每次都获取新的签名
    gcTime: 0, // 不使用缓存，离开页面后立即清除
  })
}

