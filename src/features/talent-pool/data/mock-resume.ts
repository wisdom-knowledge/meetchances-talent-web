export interface TalentResume {
  name: string
  phone: string
  email: string
  city: string
  skills: string[]
  workExperience: Array<{
    organization: string
    title: string
    start: string
    end: string
    achievements: string[]
  }>
  projects: Array<{
    name: string
    role: string
    start: string
    end: string
    achievements: string[]
  }>
  education: Array<{
    institution: string
    major: string
    degree: string
    start: string
    end: string
  }>
  selfEvaluation: string
}

export function mockResumeByTalentId(id: number, name = '候选人'): TalentResume {
  const baseName = name || `候选人${id}`
  return {
    name: baseName,
    phone: '138-0013-8000',
    email: 'candidate@example.com',
    city: '上海',
    skills: ['TypeScript', 'React', 'Node.js', 'GraphQL', 'Docker'],
    workExperience: [
      {
        organization: '一面千识科技有限公司',
        title: '高级前端工程师',
        start: '2022-03',
        end: '至今',
        achievements: [
          '主导人才库与岗位推荐前端架构设计与实现',
          '沉淀可复用的表格与筛选组件，提升产研效率 30%+',
        ],
      },
      {
        organization: 'ABC 科技',
        title: '前端工程师',
        start: '2020-06',
        end: '2022-02',
        achievements: ['负责核心业务页面性能优化', '推进工程化与单元测试落地'],
      },
    ],
    projects: [
      {
        name: '人才推荐系统',
        role: '前端负责人',
        start: '2023-01',
        end: '2024-06',
        achievements: ['搭建前端基础组件库', '实现候选人简历解析与展示流程'],
      },
    ],
    education: [
      {
        institution: '复旦大学',
        major: '软件工程',
        degree: '本科',
        start: '2016-09',
        end: '2020-06',
      },
    ],
    selfEvaluation:
      '热爱前端与用户体验，对工程化与可维护性有深入实践，具备良好的沟通协作能力与主人翁意识。',
  }
}


