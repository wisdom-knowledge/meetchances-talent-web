import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// 项目详情接口
export interface ProjectDetail {
  id: number
  title: string
  // 报酬类型：1-按条计费，2-按小时计费
  payment_type: 1 | 2
  // 报酬金额
  payment_amount: number
  // 结算时间
  settlement_time?: string
  // 结算条件
  settlement_condition?: string
  // 工作指南飞书文档链接
  work_guide_url?: string
}

export interface ProjectDetailResponse {
  code: number
  data: ProjectDetail
  msg: string
}

// 绑定状态接口
export interface BindingStatus {
  // 飞书绑定状态
  feishu_bound: boolean
  // 数据协议绑定状态
  data_agreement_bound: boolean
  // 支付绑定状态
  payment_bound: boolean
}

export interface BindingStatusResponse {
  code: number
  data: BindingStatus
  msg: string
}

// 获取项目详情
export async function getProjectDetail(projectId: number): Promise<ProjectDetail> {
  const response = await api.get(`/project/${projectId}`)
  // 处理响应数据
  if (typeof response === 'object' && response !== null) {
    const data = (response as { data?: ProjectDetail }).data
    if (data) return data
  }
  // 如果 API 还未实现，返回 mock 数据
  return {
    id: projectId,
    title: 'Coding Rubric',
    payment_type: 1,
    payment_amount: 200,
    settlement_time: '项目结束后 10 个工作日内',
    settlement_condition: '审核通过的条目数量',
    work_guide_url: 'https://meetchances.feishu.cn/wiki/YX8Lw0gCpicRaBkkOx7cyejdnXe',
  }
}

// 获取绑定状态
export async function getBindingStatus(): Promise<BindingStatus> {
  try {
    const response = await api.get('/talent/binding-status')
    if (typeof response === 'object' && response !== null) {
      const data = (response as { data?: BindingStatus }).data
      if (data) return data
    }
  } catch (_error) {
    // 如果接口失败，返回 mock 数据
  }
  // Mock 数据
  return {
    feishu_bound: false,
    data_agreement_bound: false,
    payment_bound: false,
  }
}

// 提交项目
export async function submitProject(projectId: number): Promise<void> {
  try {
    await api.post(`/project/${projectId}/submit`)
  } catch (error) {
    console.error('提交项目失败:', error)
    throw error
  }
}

// 绑定数据协议
export async function bindDataAgreement(): Promise<void> {
  try {
    await api.post('/talent/bind-data-agreement')
  } catch (error) {
    console.error('绑定数据协议失败:', error)
    throw error
  }
}

// 使用 React Query Hooks
export function useProjectDetail(projectId: number, enabled = true) {
  return useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: () => getProjectDetail(projectId),
    enabled,
  })
}

export function useBindingStatus(enabled = true) {
  return useQuery({
    queryKey: ['binding-status'],
    queryFn: getBindingStatus,
    enabled,
    staleTime: 30 * 1000, // 30秒内不重新获取
  })
}

