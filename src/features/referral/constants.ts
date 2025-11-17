export const PAGE_SIZE_OPTIONS = [50, 100, 150, 200] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

/**
 * 内推页面的 Tab 枚举
 */
export enum ReferralTab {
  /** 内推列表 */
  LIST = 'list',
  /** 付款记录 */
  PAYMENT_RECORDS = 'payment-records',
  /** 付款方式 */
  PAYMENT_METHODS = 'payment-methods',
  /** 推荐我 */
  RECOMMEND_ME = 'recommend-me',
}

/**
 * Tab 枚举值数组，用于验证
 */
export const REFERRAL_TAB_VALUES = Object.values(ReferralTab) as string[]

/**
 * 默认 Tab
 */
export const DEFAULT_REFERRAL_TAB = ReferralTab.RECOMMEND_ME

