export const PROFICIENCY_OPTIONS = [
  '初级',
  '中级',
  '高级',
  '专家',
  '熟悉',
  '精通',
] as const

export type Proficiency = (typeof PROFICIENCY_OPTIONS)[number]


