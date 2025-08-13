import { type ResumeFormValues } from './schema'

// 映射后端字段 -> 前端表单字段
export const resumeFieldMap = {
  name: 'structured_resume.basic_info.name',
  phone: 'structured_resume.basic_info.phone',
  city: 'structured_resume.basic_info.city',
  gender: 'structured_resume.basic_info.gender',
  email: 'structured_resume.basic_info.email',
  work_experience: 'structured_resume.experience.work_experience',
  project_experience: 'structured_resume.experience.project_experience',
  education: 'structured_resume.experience.education',
  self_summary: 'structured_resume.self_assessment.summary',
  hard_skills: 'structured_resume.self_assessment.hard_skills',
  soft_skills: 'structured_resume.self_assessment.soft_skills',
} as const

// 选项配置
export const options = {
  gender: ['男', '女', '其他', '不愿透露'],
  city: ['北京', '上海', '广州', '深圳', '杭州', '成都', '其他'],
  proficiency: ['初级', '中级', '高级', '专家', '熟悉', '精通'],
} as const

// 表单渲染配置（展示、文案、组件类型、占位符等）
export const resumeFormConfig: {
  sections: Array<{
    key: string
    title: string
    fields?: Array<{
      key: keyof ResumeFormValues
      label: string
      component: 'input' | 'select' | 'textarea' | 'tags'
      placeholder?: string
      optionsKey?: keyof typeof options
      disabled?: boolean
    }>
  }>
} = {
  sections: [
    {
      key: 'basic',
      title: '基本信息',
      fields: [
        { key: 'name', label: '姓名', component: 'input', placeholder: '请输入姓名', disabled: true },
        { key: 'gender', label: '性别', component: 'select', optionsKey: 'gender', placeholder: '请选择性别' },
        { key: 'phone', label: '电话', component: 'input', placeholder: '请输入电话号码', disabled: true },
        { key: 'email', label: '邮箱', component: 'input', placeholder: '请输入邮箱地址' },
        { key: 'city', label: '所在城市', component: 'select', optionsKey: 'city', placeholder: '请选择所在城市' },
        { key: 'origin', label: '籍贯', component: 'input', placeholder: '请输入籍贯' },
        { key: 'expectedSalary', label: '期望薪资/月', component: 'input', placeholder: '例如：30000; 3万; 20k-40k' },
      ],
    },
    {
      key: 'interests',
      title: '兴趣与技能',
      fields: [
        { key: 'hobbies', label: '兴趣爱好', component: 'tags', placeholder: '例如：阅读、旅行、摄影、编程...' },
        { key: 'skills', label: '技能', component: 'tags', placeholder: '例如：JavaScript、Python、UI设计...' },
      ],
    },
    {
      key: 'workSkills',
      title: '工作技能',
      fields: [
        { key: 'workSkillName', label: '技能名称', component: 'input', placeholder: '例如：前端开发' },
        {
          key: 'workSkillLevel',
          label: '熟练程度',
          component: 'select',
          optionsKey: 'proficiency',
          placeholder: '请选择熟练程度',
        },
        { key: 'softSkills', label: '软技能', component: 'tags', placeholder: '例如：团队协作、沟通能力、项目管理...' },
      ],
    },
    {
      key: 'self',
      title: '自我评价',
      fields: [{ key: 'selfEvaluation', label: '自我评价', component: 'textarea', placeholder: '请输入自我评价...' }],
    },
  ],
}


