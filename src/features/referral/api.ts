import { api } from '@/lib/api'

// 内推奖状态枚举
export type ReferralStatus = 'pending' | 'approved' | 'paid' | 'rejected'

// 内推列表项
export interface ReferralListItem {
  id: number // talent ID（被推荐人的ID）
  referred_name: string // 被推荐人姓名
  referred_phone: string // 被推荐人手机号（脱敏显示）
  status: 0 | 10 | 20 | 30 // 内推奖状态：0-待完成任务，10-待发放，20-已结算，30-已拒绝
  completed_activities?: string | null // 已完成的内推活动描述
  reward_amount?: number | null // 内推收入（税前）
  reward_date?: string | null // 奖励时间
}

export interface ReferralListResponse {
  items: ReferralListItem[]
  count: number
}

export interface ReferralListParams {
  skip: number
  limit: number
  status?: ReferralStatus // 按内推奖状态筛选
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
  const res = await api.get('/talent/referral-list', { params })
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


