import { JobType } from '@/constants/explore'

export interface Job {
  id: string
  title: string
  company: string
  description: string
  requirements: string[]
  details: string[]
  process: string[]
  benefitsAndSalary: string[]
  jobType: JobType
  salaryType: string
  salaryRange: [number, number]
  referralBonus: number
  companyDescription: string
}


