import { api } from '@/lib/api'

export interface ExpenseDetail {
  id: number
  project_id: number
  project_name: string
  payment_type?: string
  task_id?: number | string
  actual_unit_price: number
  apply_amount: number
  payable_hours: number
  payment_status: number
  expense_status: number
  other_id?: string
  created_at?: string
}

export interface ExpenseDetailsResponse {
  data: ExpenseDetail[]
  count: number
}

export interface WithdrawalBalanceResponse {
  available_balance: number
  pending_balance: number
  withdrawn_total: number
}

export interface DisbursementRecord {
  id: number
  user_name?: string
  user_id?: number
  phone?: string
  id_card?: string
  payee_name?: string
  payment_method: 0 | 1 | 2 | 3
  payment_date: string
  payment_id: string
  batch_id: string
  total_amount: number
  original_total_amount: number
  tax_amount: number
  actual_amount: number
  split_index: number
  split_total: number
  disbursement_status: 0 | 10 | 20 | 30
  remark?: string
  created_at?: string
  updated_at?: string
  is_deleted?: boolean
}

export interface DisbursementRecordsResponse {
  data: DisbursementRecord[]
  count: number
}

export interface WalletInfo {
  id: number
  talent_id: number
  available_balance: number
  frozen_balance: number
  total_income: number
  total_withdrawal: number
  current_month_income?: number
  refer_income?: number
  current_month_refer_income?: number
  created_at: string
  updated_at: string
}

export interface WalletDetailsResponse {
  wallet: WalletInfo
  recent_transactions: unknown[]
}

export interface ExpenseQueryParams {
  skip: number
  limit: number
  project_id?: number
  expense_status?: number | number[]
  payment_status?: number
}

export interface DisbursementQueryParams {
  skip: number
  limit: number
  disbursement_status?: number
  payment_method?: number
  batch_id?: string
}

export async function getExpenseDetails(params: ExpenseQueryParams): Promise<ExpenseDetailsResponse> {
  const res = await api.get('/talent/expense-details', { params })
  return res as unknown as ExpenseDetailsResponse
}

export async function getWithdrawalBalance(): Promise<WithdrawalBalanceResponse> {
  const res = await api.get('/talent/withdrawal/balance')
  return res as unknown as WithdrawalBalanceResponse
}

export async function getDisbursementRecords(params: DisbursementQueryParams): Promise<DisbursementRecordsResponse> {
  const res = await api.get('/talent/disbursement-records', { params })
  return res as unknown as DisbursementRecordsResponse
}

export async function getWalletDetails(): Promise<WalletDetailsResponse> {
  const res = await api.get('/talent/wallet')
  return res as unknown as WalletDetailsResponse
}


