import { z } from 'zod'

export const resumeSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['男', '女', '其他', '不愿透露']).optional(),
  phone: z.string().optional(),
  email: z.string().email('请输入有效邮箱地址').optional().or(z.literal('')),
  city: z.string().optional(),
  origin: z.string().optional(),
  expectedSalary: z.string().optional(),
  hobbies: z.string().optional(),
  skills: z.string().optional(),
  workSkillName: z.string().optional(),
  workSkillLevel: z.enum(['初级', '中级', '高级', '专家']).optional(),
  softSkills: z.string().optional(),
  selfEvaluation: z.string().optional(),
})

export type ResumeFormValues = z.infer<typeof resumeSchema>


