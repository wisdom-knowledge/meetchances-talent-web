import type { ReferralIncomeData, ReferralListItem, InviteCodeInfo } from './api'

// Mock 内推收入数据
export const mockReferralIncome: ReferralIncomeData = {
  total_income: 8560.00,
  current_month_income: 2340.00,
  pending_amount: 1820.00,
}

// Mock 内推列表数据
export const mockReferralList: ReferralListItem[] = [
  {
    id: 1,
    referee_name: '张三',
    phone: '138****1234',
    last_login_time: '2025-01-15T10:30:00Z',
    active_projects: 2,
    completed_tasks: 5,
    referral_income: 800.00,
    payment_status: 10,
    payment_time: '2025-01-10T08:00:00Z',
  },
  {
    id: 2,
    referee_name: '李四',
    phone: '139****5678',
    last_login_time: '2025-01-14T15:20:00Z',
    active_projects: 1,
    completed_tasks: 3,
    referral_income: 480.00,
    payment_status: 0,
  },
  {
    id: 3,
    referee_name: '王五',
    phone: '136****9012',
    last_login_time: '2025-01-13T09:15:00Z',
    active_projects: 0,
    completed_tasks: 8,
    referral_income: 1280.00,
    payment_status: 10,
    payment_time: '2025-01-08T08:00:00Z',
  },
]

// Mock 邀请码信息（123456 可以查到）
export const mockInviteCodeMap: Record<string, InviteCodeInfo> = {
  '123456': {
    name: '刘先',
    phone: '15628191221',
  },
}

