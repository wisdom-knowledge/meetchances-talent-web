import { JobType } from '@/constants/explore'

export interface Job {
  id: string | number
  title: string
  company: string
  description: string // 富文本 HTML 片段
  jobType: JobType
  salaryType: string
  salaryRange: [number, number]
  referralBonus: number
}


