import { z } from 'zod'

export const resumeSchema = z.object({
  name: z.preprocess(
    (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
    z.string().min(1, '姓名为必填项')
  ),
  gender: z.string().optional(),
  phone: z.preprocess(
    (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
    z
      .string()
      .min(1, '电话为必填项')
      .refine((val) => {
        // 优先匹配中国大陆手机号；其次匹配座机（区号+本地号，可选分机）；否则回退为 E.164（7–15 位数字）
        const normalized = val.trim()
        const cnMobile = /^1[3-9]\d{9}$/
        if (cnMobile.test(normalized)) return true
        const landline = /^0\d{2,3}-?\d{7,8}(?:-\d{1,4})?$/
        if (landline.test(normalized)) return true
        // 禁止包含字母等非法字符，仅允许 + 数字 空格 - ()
        if (/[A-Za-z]/.test(normalized)) return false
        if (!/^[+\d\s()-]+$/.test(normalized)) return false
        const digits = normalized.replace(/\D/g, '')
        return digits.length >= 7 && digits.length <= 15
      }, '请输入有效电话号码')
  ),
  email: z.preprocess(
    (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
    z.union([z.string().email('请输入有效邮箱地址'), z.literal('')])
  ),
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
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '请填写熟练程度',
              path: ['level'],
            })
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
        institution: z.preprocess(
          (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
          z.string().min(1, '学校/机构为必填项')
        ),
        major: z.preprocess(
          (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
          z.string().min(1, '专业为必填项')
        ),
        degreeType: z.preprocess(
          (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
          z.string().min(1, '学历/学位为必填项')
        ),
        degreeStatus: z.preprocess(
          (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
          z.string().min(1, '学业状态为必填项')
        ),
        city: z.string().optional(),
        startDate: z.preprocess(
          (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
          z.string().min(1, '开始时间为必填项')
        ),
        endDate: z.preprocess(
          (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
          z.string().min(1, '结束时间为必填项')
        ),
        achievements: z.string().optional(),
      })
    )
    .min(1, '请添加教育经历'),
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
