/**
 * 模拟面试页面的 Tab 枚举
 */
export enum MockInterviewTab {
  /** 模拟面试 */
  INTERVIEW = 'interview',
  /** 我的记录 */
  RECORDS = 'records',
}

/**
 * Tab 枚举值数组，用于验证
 */
export const MOCK_INTERVIEW_TAB_VALUES = Object.values(MockInterviewTab) as string[]

/**
 * 默认 Tab
 */
export const DEFAULT_MOCK_INTERVIEW_TAB = MockInterviewTab.INTERVIEW
