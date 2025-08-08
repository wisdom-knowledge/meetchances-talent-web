import { 
  IconBrandPython,
  IconBrandGit,
  IconBrandDocker,
  IconTerminal2,
  IconShieldCheck,
  IconUsers,
} from '@tabler/icons-react'

export interface SkillItem {
  id: string
  name: string
  description?: string
  level: string
  icon: React.ReactNode
  image?: string
  variant: 'experienced' | 'senior' | 'excellent' | 'high'
}

export interface CandidateInfo {
  name: string
  avatar: string
  workYears: number
  workExperience: string[]
  projectHistory: {
    name: string
    skills: string
  }[]
  aiMatchScore: number
}

export interface TranscriptItem {
  timestamp: string
  speaker: 'AI面试官' | '候选人'
  content: string
}

export interface InterviewRecordingData {
  videoUrl: string
  videoThumbnail: string
  language: string
  transcript: TranscriptItem[]
}

export interface ViolationItem {
  type: string
  description: string
  count?: number
}

export interface ProctoringResultData {
  score: number
  description: string
  violations: ViolationItem[]
}

export interface AboutCandidateData {
  name: string
  description: string
  resumeUrl: string
  resumeFilename: string
}

export interface CandidateSkillsData {
  skills: string[]
  showMoreText: string
}

export interface WorkExperienceItem {
  id: string
  position: string
  company: string
  companyIcon: string
  startDate: string
  endDate: string
  duration: string
  responsibilities: string[]
  techStacks: string[]
  showReadMore?: boolean
}

export interface WorkExperienceData {
  experiences: WorkExperienceItem[]
}

export interface EducationItem {
  id: string
  degree: string
  major: string
  school: string
  schoolIcon: string
  startDate: string
  endDate: string
  duration: string
  description?: string
  achievements?: string[]
}

export interface EducationData {
  educations: EducationItem[]
}

export interface InterviewReportData {
  candidate: CandidateInfo
  skills: SkillItem[]
  recording: InterviewRecordingData
  proctoring: ProctoringResultData
  about: AboutCandidateData
  candidateSkills: CandidateSkillsData
  workExperience: WorkExperienceData
  education: EducationData
}

// 技能数据
const skillsData: SkillItem[] = [
  {
    id: 'linux',
    name: 'Linux',
    level: 'Experienced',
    description: '3年',
    image: 'https://dnu-cdn.xpertiise.com/common/f073a283-21d2-4bb9-983b-28e5da613bf1.png',
    icon: <IconTerminal2 size={20} className='text-gray-700' />,
    variant: 'experienced'
  },
  {
    id: 'git',
    name: 'Git',
    level: 'Experienced', 
    description: '1年',
    image: 'https://dnu-cdn.xpertiise.com/common/4cae40a6-2c5f-46ce-a1e1-24999e4fd395.png',
    icon: <IconBrandGit size={20} className='text-gray-700' />,
    variant: 'experienced'
  },
  {
    id: 'python',
    name: 'Python',
    level: 'Senior',
    description: '3.5年',
    image: 'https://dnu-cdn.xpertiise.com/common/6552329d-7154-412d-846a-ec74adee2434.png',
    icon: <IconBrandPython size={20} className='text-gray-700' />,
    variant: 'senior'
  },
  {
    id: 'docker',
    name: 'Docker',
    level: 'Experienced',
    description: '2年',
    image: 'https://dnu-cdn.xpertiise.com/common/1f514a95-1f6b-428a-8344-e47cc5b1ec4c.png',
    icon: <IconBrandDocker size={20} className='text-gray-700' />,
    variant: 'experienced'
  },
  {
    id: 'resume-authenticity',
    name: '简历真实性',
    level: '高',
    description: '综合评估',
    icon: <IconShieldCheck size={36} className='text-gray-700' />,
    variant: 'high'
  },
  {
    id: 'communication',
    name: '沟通技巧',
    level: '高',
    description: '面试表现',
    icon: <IconUsers size={36} className='text-gray-700' />,
    variant: 'high'
  }
]

// 候选人数据
const candidateData: CandidateInfo = {
  name: '陈冲',
  avatar: 'https://dnu-cdn.xpertiise.com/common/105f2ec8-ce22-402e-bf73-6df175d98187.jpg',
  workYears: 5,
  workExperience: ['美团', '阿里'],
  projectHistory: [
    {
      name: 'Python(D)',
      skills: '4.4/5'
    },
    {
      name: 'ReactJS',
      skills: '3.6/5'
    }
  ],
  aiMatchScore: 75.8
}

// 面试录音数据
const recordingData: InterviewRecordingData = {
  videoUrl: 'https://dnu-cdn.xpertiise.com/common/interview-sample.mov',
  videoThumbnail: 'https://dnu-cdn.xpertiise.com/common/105f2ec8-ce22-402e-bf73-6df175d98187.jpg',
  language: '中文',
  transcript: [
    {
      timestamp: '00:02',
      speaker: 'AI面试官',
      content: '让我们来深入了解一下您在React Native方面的经验。您能告诉我一个您使用React Native的项目吗？'
    },
    {
      timestamp: '00:02',
      speaker: '候选人',
      content: '当然可以！我最近参与了一个项目，我们为一个零售客户使用React Native开发了一个跨平台移动应用程序。目标是创建一个允许用户浏览产品、将其添加到购物车并在iOS和Android设备上无缝购买的应用程序。'
    },
    {
      timestamp: '00:02',
      speaker: 'AI面试官',
      content: '听起来是个很有趣的项目！您能分享一些使用React Native实现的关键功能吗？'
    },
    {
      timestamp: '01:15',
      speaker: '候选人',
      content: '当然！我们实现了几个关键功能，包括用户身份验证、带有搜索和筛选功能的产品目录浏览、购物车功能、与Stripe的支付集成、订单更新的推送通知，以及为更好用户体验的离线数据缓存。'
    },
    {
      timestamp: '01:45',
      speaker: 'AI面试官',
      content: '太棒了！您能告诉我在使用React Native工作时遇到的挑战以及您是如何克服这些挑战的吗？'
    },
    {
      timestamp: '02:10',
      speaker: '候选人',
      content: '一个主要挑战是性能优化，特别是处理大型产品列表。我们通过实现FlatList并进行适当的键提取以及对列表项使用React.memo来解决这个问题。另一个挑战是处理不同设备的屏幕尺寸和方向，我们使用响应式设计原则和在多个设备模拟器上进行测试来解决这个问题。'
    }
  ]
}

// AI面试监考结果数据
const proctoringData: ProctoringResultData = {
  score: 77,
  description: '此得分介于0至100%之间，根据与作弊相关的违规行为持续时间计算得出。例如，切换标签页、眼部移动等。得分越高，表现越好。',
  violations: [
    {
      type: '眼部移动',
      description: '候选人眼睛离开屏幕1次，每次持续时间较长。'
    }
  ]
}

// 关于候选人数据
const aboutCandidateData: AboutCandidateData = {
  name: '王小明',
  description: '一位机器学习爱好者，拥有扎实的学术记录和丰富的行业以及研究经验，专业领域涵盖数据科学、自然语言处理和计算机视觉。该候选人在生成式AI、向量数据库和深度推荐系统等前沿项目中发挥了引领作用，同时保持着稳健的CI/CD实践。凭借横跨硕士研究、多个研究助理职位和实际行业实施的背景，这位专业人士善于应对跨职能挑战并交付创新的AI解决方案。',
  resumeUrl: '/files/resume.pdf',
  resumeFilename: '王小明_简历.pdf'
}

// 候选人技能数据
const candidateSkillsData: CandidateSkillsData = {
  skills: [
    'NLP', 
    '生成式AI/提示工程', 
    '可解释AI', 
    'RAG', 
    '聚类', 
    '计算机视觉', 
    'Scrum',
    'CI/CD',
    'TensorFlow',
    'PyTorch',
    'Python',
    'Java',
    'SQL',
    'Docker',
    'Kubernetes',
    '深度学习',
    '推荐系统',
    '向量数据库',
    '数据科学',
    '机器学习'
  ],
  showMoreText: '+40 更多'
}

// 工作经历数据
const workExperienceData: WorkExperienceData = {
  experiences: [
    {
      id: 'bytedance',
      position: '大模型训练工程师',
      company: '字节跳动',
      companyIcon: 'https://dnu-cdn.xpertiise.com/common/%E5%AD%97%E8%8A%82%E8%B7%B3%E5%8A%A8.png',
      startDate: '2022年11月',
      endDate: '至今',
      duration: '2年9个月',
      responsibilities: [
        '负责大规模语言模型预训练数据的清洗、去重和质量评估，处理TB级别的训练数据集。',
        '参与豆包大模型的数据工程流程优化，设计并实现高效的数据预处理管道，提升训练效率30%。',
        '负责多模态模型训练数据的标注质量管控，建立自动化质量检测系统，确保数据标注准确率达到95%以上。',
        '参与分布式训练系统的性能优化，协助解决大模型训练中的数据并行和模型并行技术难题。'
      ],
      techStacks: ['大语言模型', '数据预处理', '分布式训练', 'PyTorch', 'CUDA', '数据标注', '质量评估'],
      showReadMore: true
    },
    {
      id: 'drimco',
      position: '数据科学家及硕士论文研究',
      company: 'DRIMCo GmbH',
      companyIcon: 'https://dummyimage.com/64x64/059669/ffffff?text=DR',
      startDate: '2020年8月',
      endDate: '2021年9月',
      duration: '1年1个月',
      responsibilities: [
        '处理命名实体识别、联邦学习和持续/终身学习任务。',
        '支持使用Git、Scrum、JIRA、MLflow、Docker、Neo4j和Sphinx的研究和开发项目。'
      ],
      techStacks: ['命名实体识别', '联邦学习', '持续学习', '终身学习', 'Git', 'Scrum', 'JIRA', 'MLflow', 'Docker', 'Neo4j', 'Sphinx']
    },
    {
      id: 'research-assistant',
      position: '研究助理（学生工）',
      company: '德国大学研究所',
      companyIcon: 'https://dummyimage.com/64x64/7C3AED/ffffff?text=UNI',
      startDate: '2018年11月',
      endDate: '2019年9月',
      duration: '10个月',
      responsibilities: [
        '协助进行机器学习和深度学习相关的研究项目。',
        '参与数据收集、预处理和模型训练工作。',
        '协助撰写研究报告和学术论文。'
      ],
      techStacks: ['Python', '机器学习', '深度学习', '数据预处理', '学术研究']
    }
  ]
}

// 教育经历数据
const educationData: EducationData = {
  educations: [
    {
      id: 'sjtu-master',
      degree: '计算机科学与技术硕士',
      major: '人工智能方向',
      school: '上海交通大学',
      schoolIcon: 'https://dnu-cdn.xpertiise.com/common/bd6179ea-5014-4a15-8f2c-0ed5e463b0e5.png',
      startDate: '2018年9月',
      endDate: '2021年6月',
      duration: '2年9个月',
      description: '专注于机器学习和深度学习研究，师从国际知名教授，参与多项国家级AI科研项目。',
      achievements: [
        '获得上海交通大学优秀研究生奖学金',
        '在顶级期刊发表机器学习相关论文2篇',
        '参与国家自然科学基金重点项目"深度学习理论与应用"',
        '担任研究生会学术部部长，组织多场国际学术会议'
      ]
    },
    {
      id: 'harvard-master',
      degree: '数据科学硕士',
      major: '机器学习与统计学',
      school: '哈佛大学',
      schoolIcon: 'https://dnu-cdn.xpertiise.com/common/3ba95e44-3601-4526-b816-a20acce9998d.png',
      startDate: '2016年9月',
      endDate: '2018年5月',
      duration: '1年8个月',
      description: '在世界顶尖学府深入学习数据科学前沿理论和实践，与来自全球的优秀学者共同探索AI领域前沿问题。',
      achievements: [
        '以优异成绩（GPA 3.9/4.0）毕业，获得院长嘉奖',
        '获得哈佛大学Merit-Based全额奖学金',
        '在IEEE国际会议上发表深度学习算法优化论文',
        '参与Google AI实验室合作项目，研究自然语言处理算法'
      ]
    }
  ]
}

// 统一的面试报告数据导出
export const interviewReportData: InterviewReportData = {
  candidate: candidateData,
  skills: skillsData,
  recording: recordingData,
  proctoring: proctoringData,
  about: aboutCandidateData,
  candidateSkills: candidateSkillsData,
  workExperience: workExperienceData,
  education: educationData
}

// 向后兼容的导出
export const defaultSkillsData = skillsData
export const mockCandidateData = candidateData
