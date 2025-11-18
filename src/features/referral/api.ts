import { api } from '@/lib/api'

// 内推列表项
export interface ReferralListItem {
  id: number
  referee_name: string // 被推荐人
  phone: string // 手机号
  last_login_time?: string // 最近登录时间
  active_projects: number // 参与中的内推项目
  completed_tasks: number // 完成任务数
  referral_income: number // 内推收入（税前）
  payment_status: 0 | 10 // 支付状态：0-待发放，10-已发放
  payment_time?: string // 支付时间
  created_at?: string
}

export interface ReferralListResponse {
  data: ReferralListItem[]
  count: number
}

export interface ReferralListParams {
  skip: number
  limit: number
}

// 内推收入数据
export interface ReferralIncomeData {
  total_income: number // 任务收入总额（税前）
  current_month_income: number // 本月收入
  pending_amount: number // 待发放（税前）
}

// 邀请码信息
export interface InviteCodeInfo {
  name: string
  phone: string
  referrer_username?: string // 邀请人用户名
}


// 获取内推列表
export async function getReferralList(params: ReferralListParams): Promise<ReferralListResponse> {
  const res = await api.get('/talent/referral/list', { params })
  return res as unknown as ReferralListResponse
}

// 获取内推收入数据
export async function getReferralIncome(): Promise<ReferralIncomeData> {
  const res = await api.get('/talent/referral/income')
  return res as unknown as ReferralIncomeData
}

// 验证邀请码
export async function validateInviteCode(code: string): Promise<InviteCodeInfo> {
  const res = await api.get('/talent/validate-referral-code', { params: { code } })
  return res as unknown as InviteCodeInfo
}

// 绑定邀请码
export async function bindInviteCode(code: string): Promise<{ success: boolean }> {
  const res = await api.patch('/talent/me', { referred_by_code: code })
  return res as unknown as { success: boolean }
}


