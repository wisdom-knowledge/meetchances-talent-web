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

// ===== 项目统计（综合评分模块）=====
export interface ProjectScoreDistributionItem {
  /**
   * 分数标签（例如：'5.0'、'4.0'、'3.0'、'2.5'）
   * 注：2.5 为警戒线，虽然实际分数为整数，但仍需展示该行
   */
  label: string
  /** 当前分数段数量 */
  count: number
  /** 是否为 >=3 的正向区间，用于区分进度条颜色 */
  isPositive: boolean
}

export interface ProjectStats {
  /** 我的平均分 */
  myAvgScore: number
  /** 项目整体平均分 */
  projectAvgScore: number
  /** 分数分布（5.0 -> 1.0，包含 2.5 警戒线） */
  scoreDistribution: ProjectScoreDistributionItem[]
  /** 此项目至今已赚 */
  earnedAmount: number
  /** 终审通过率（0~1） */
  finalPassRate: number
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

// 获取项目统计（接口未对接前的 mock）
export async function getProjectStats(_projectId: number): Promise<ProjectStats> {
  // TODO: 等后端提供统计接口后替换为真实请求
  return {
    myAvgScore: 2.6,
    projectAvgScore: 2.4,
    scoreDistribution: [
      { label: '5.0', count: 0, isPositive: true },
      { label: '4.0', count: 0, isPositive: true },
      { label: '3.0', count: 3, isPositive: true },
      // 2.5 警戒线
      { label: '2.5', count: 0, isPositive: false },
      { label: '2.0', count: 0, isPositive: false },
      { label: '1.0', count: 0, isPositive: false },
    ],
    earnedAmount: 1230.5,
    finalPassRate: 0.4,
  }
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

