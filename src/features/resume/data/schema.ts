import { z } from 'zod'

export const resumeSchema = z.object({
  name: z.string().optional(),
  gender: z
    .string()
    .optional(),
  phone: z.string().optional(),
  email: z.string().email('请输入有效邮箱地址').optional().or(z.literal('')),
  city: z.string().optional(),
  origin: z.string().optional(),
  expectedSalary: z.string().optional(),
  hobbies: z.string().optional(),
  skills: z.string().optional(),
  softSkills: z.string().optional(),
  selfEvaluation: z.string().optional(),
  workSkills: z
    .array(
      z
        .object({
          name: z.string().optional(),
          level: z.string().optional(),
        })
        .superRefine((val, ctx) => {
          if (val?.name && !val?.level) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: '请选择熟练程度', path: ['level'] })
          }
        })
    )
    .optional(),
  workExperience: z
    .array(
      z.object({
        organization: z.string().optional(),
        title: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        city: z.string().optional(),
        employmentType: z.string().optional(),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  projectExperience: z
    .array(
      z.object({
        organization: z.string().optional(),
        role: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string().optional(),
        major: z.string().optional(),
        degreeType: z.string().optional(),
        degreeStatus: z.string().optional(),
        city: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  // 附加资质：奖励
  awards: z
    .array(
      z.object({
        title: z.string().min(1, '奖项名称为必填项'),
        issuer: z.string().optional(),
        date: z.string().min(1, '获奖时间为必填项'),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  // 附加资质：论文发表
  publications: z
    .array(
      z.object({
        title: z.string().min(1, '论文题目为必填项'),
        publisher: z.string().optional(),
        date: z.string().min(1, '发表时间为必填项'),
        url: z.string().url('请输入有效链接').optional(),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  // 附加资质：代码仓库
  repositories: z
    .array(
      z.object({
        name: z.string().min(1, '仓库名称为必填项'),
        url: z.string().url('请输入有效链接').min(1, '仓库链接为必填项'),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  // 附加资质：专利
  patents: z
    .array(
      z.object({
        title: z.string().min(1, '专利名称为必填项'),
        number: z.string().optional(),
        status: z.string().optional(),
        date: z.string().min(1, '日期为必填项'),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  // 附加资质：社交媒体
  socialMedia: z
    .array(
      z.object({
        platform: z.string().min(1, '平台为必填项'),
        handle: z.string().optional(),
        url: z.string().url('请输入有效链接').min(1, '链接为必填项'),
        achievements: z.string().optional(),
      })
    )
    .optional(),
})

export type ResumeFormValues = z.infer<typeof resumeSchema>
