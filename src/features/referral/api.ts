import { api } from '@/lib/api'
import { mockReferralIncome, mockReferralList, mockInviteCodeMap, mockRecommendMeStatus } from './mock'

const USE_MOCK = true // 开发时使用mock数据

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
}

// 推荐我的状态
export interface RecommendMeStatus {
  status: 'self_registered' | 'already_recommended' | 'not_recommended' // 自己注册 | 已被推荐 | 未被推荐
  referrer_name?: string // 推荐人姓名
  referrer_phone?: string // 推荐人手机号
}

// 获取内推列表
export async function getReferralList(params: ReferralListParams): Promise<ReferralListResponse> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { skip, limit } = params
        const allItems = mockReferralList
        const items = allItems.slice(skip, skip + limit)
        resolve({
          data: items,
          count: allItems.length,
        })
      }, 300)
    })
  }
  const res = await api.get('/talent/referral/list', { params })
  return res as unknown as ReferralListResponse
}

// 获取内推收入数据
export async function getReferralIncome(): Promise<ReferralIncomeData> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockReferralIncome)
      }, 300)
    })
  }
  const res = await api.get('/talent/referral/income')
  return res as unknown as ReferralIncomeData
}

// 验证邀请码
export async function validateInviteCode(code: string): Promise<InviteCodeInfo> {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const info = mockInviteCodeMap[code]
        if (info) {
          resolve(info)
        } else {
          reject(new Error('邀请码不存在'))
        }
      }, 300)
    })
  }
  const res = await api.get('/talent/referral/validate-code', { params: { code } })
  return res as unknown as InviteCodeInfo
}

// 绑定邀请码
export async function bindInviteCode(code: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const info = mockInviteCodeMap[code]
        if (info) {
          resolve({ success: true })
        } else {
          reject(new Error('邀请码不存在'))
        }
      }, 500)
    })
  }
  const res = await api.post('/talent/referral/bind-code', { code })
  return res as unknown as { success: boolean }
}

// 获取推荐我的状态
export async function getRecommendMeStatus(): Promise<RecommendMeStatus> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockRecommendMeStatus)
      }, 300)
    })
  }
  const res = await api.get('/talent/referral/recommend-me-status')
  return res as unknown as RecommendMeStatus
}

