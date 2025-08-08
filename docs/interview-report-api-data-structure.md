# 面试分析报告 API 数据结构规范

## 概述
本文档定义了面试分析报告页面所需的完整数据结构，供后端 API 开发参考。

## 完整数据结构定义

```typescript
// 主要接口定义
interface InterviewReportData {
  candidate: CandidateInfo           // 候选人基本信息
  skills: SkillItem[]                // 技能考核结果
  recording: InterviewRecordingData  // AI面试录音数据
  proctoring: ProctoringResultData   // AI面试监考结果
  about: AboutCandidateData          // 关于候选人
  candidateSkills: CandidateSkillsData // 候选人技能列表
  workExperience: WorkExperienceData // 工作经历
  education: EducationData           // 教育经历
}

// 候选人基本信息
interface CandidateInfo {
  name: string                       // 姓名
  avatar: string                     // 头像URL
  workYears: number                  // 工作年限
  workExperience: string[]           // 过往工作经历（公司名称）
  projectHistory: {                  // 项目历史
    name: string                     // 项目/技能名称
    skills: string                   // 技能评分（如："4.4/5"）
  }[]
  aiMatchScore: number               // AI匹配得分（0-100）
}

// 技能考核项目
interface SkillItem {
  id: string                         // 唯一标识
  name: string                       // 技能名称
  description?: string               // 描述信息
  level: string                      // 等级（如："Experienced", "Senior", "高"）
  iconName?: string                  // 图标名称（前端处理）
  image?: string                     // 图片URL（优先使用）
  variant: 'experienced' | 'senior' | 'excellent' | 'high' // 显示样式变体
}

// 面试录音对话记录
interface TranscriptItem {
  timestamp: string                  // 时间戳（如："00:02"）
  speaker: 'AI面试官' | '候选人'      // 发言人
  content: string                    // 对话内容
}

interface InterviewRecordingData {
  videoUrl: string                   // 视频文件URL
  videoThumbnail: string             // 视频缩略图URL
  language: string                   // 面试语言
  transcript: TranscriptItem[]       // 对话记录
}

// 监考违规项目
interface ViolationItem {
  type: string                       // 违规类型
  description: string                // 违规描述
  count?: number                     // 违规次数（可选）
}

interface ProctoringResultData {
  score: number                      // 监考得分（0-100）
  description: string                // 得分说明
  violations: ViolationItem[]        // 违规记录
}

// 关于候选人
interface AboutCandidateData {
  name: string                       // 候选人姓名
  description: string                // 个人描述
  resumeUrl: string                  // 简历文件URL
  resumeFilename: string             // 简历文件名
}

// 候选人技能标签
interface CandidateSkillsData {
  skills: string[]                   // 技能列表
  showMoreText: string               // "显示更多"按钮文本
}

// 工作经历
interface WorkExperienceItem {
  id: string                         // 唯一标识
  position: string                   // 职位
  company: string                    // 公司名称
  companyIcon: string                // 公司图标URL
  startDate: string                  // 开始时间
  endDate: string                    // 结束时间
  duration: string                   // 工作时长
  responsibilities: string[]         // 职责描述
  techStacks: string[]               // 技术栈
  showReadMore?: boolean             // 是否显示"阅读更多"（可选）
}

interface WorkExperienceData {
  experiences: WorkExperienceItem[]
}

// 教育经历
interface EducationItem {
  id: string                         // 唯一标识
  degree: string                     // 学位
  major: string                      // 专业
  school: string                     // 学校名称
  schoolIcon: string                 // 学校图标URL
  startDate: string                  // 开始时间
  endDate: string                    // 结束时间
  duration: string                   // 就读时长
  description?: string               // 描述（可选）
  achievements?: string[]            // 成就列表（可选）
}

interface EducationData {
  educations: EducationItem[]
}
```

## 完整JSON数据示例

```json
{
  "candidate": {
    "name": "陈冲",
    "avatar": "https://dnu-cdn.xpertiise.com/common/105f2ec8-ce22-402e-bf73-6df175d98187.jpg",
    "workYears": 5,
    "workExperience": ["美团", "阿里"],
    "projectHistory": [
      {
        "name": "Python(D)",
        "skills": "4.4/5"
      },
      {
        "name": "ReactJS",
        "skills": "3.6/5"
      }
    ],
    "aiMatchScore": 75.8
  },
  "skills": [
    {
      "id": "linux",
      "name": "Linux",
      "level": "Experienced",
      "description": "3年",
      "image": "https://dnu-cdn.xpertiise.com/common/f073a283-21d2-4bb9-983b-28e5da613bf1.png",
      "iconName": "IconTerminal2",
      "variant": "experienced"
    },
    {
      "id": "git",
      "name": "Git",
      "level": "Experienced",
      "description": "1年",
      "image": "https://dnu-cdn.xpertiise.com/common/4cae40a6-2c5f-46ce-a1e1-24999e4fd395.png",
      "iconName": "IconBrandGit",
      "variant": "experienced"
    },
    {
      "id": "python",
      "name": "Python",
      "level": "Senior",
      "description": "3.5年",
      "image": "https://dnu-cdn.xpertiise.com/common/6552329d-7154-412d-846a-ec74adee2434.png",
      "iconName": "IconBrandPython",
      "variant": "senior"
    },
    {
      "id": "docker",
      "name": "Docker",
      "level": "Experienced",
      "description": "2年",
      "image": "https://dnu-cdn.xpertiise.com/common/1f514a95-1f6b-428a-8344-e47cc5b1ec4c.png",
      "iconName": "IconBrandDocker",
      "variant": "experienced"
    },
    {
      "id": "resume-authenticity",
      "name": "简历真实性",
      "level": "高",
      "description": "综合评估",
      "iconName": "IconShieldCheck",
      "variant": "high"
    },
    {
      "id": "communication",
      "name": "沟通技巧",
      "level": "高",
      "description": "面试表现",
      "iconName": "IconUsers",
      "variant": "high"
    }
  ],
  "recording": {
    "videoUrl": "https://dnu-cdn.xpertiise.com/common/interview-sample.mov",
    "videoThumbnail": "https://dnu-cdn.xpertiise.com/common/105f2ec8-ce22-402e-bf73-6df175d98187.jpg",
    "language": "中文",
    "transcript": [
      {
        "timestamp": "00:02",
        "speaker": "AI面试官",
        "content": "让我们来深入了解一下您在React Native方面的经验。您能告诉我一个您使用React Native的项目吗？"
      },
      {
        "timestamp": "00:02",
        "speaker": "候选人",
        "content": "当然可以！我最近参与了一个项目，我们为一个零售客户使用React Native开发了一个跨平台移动应用程序。目标是创建一个允许用户浏览产品、将其添加到购物车并在iOS和Android设备上无缝购买的应用程序。"
      },
      {
        "timestamp": "00:02",
        "speaker": "AI面试官",
        "content": "听起来是个很有趣的项目！您能分享一些使用React Native实现的关键功能吗？"
      },
      {
        "timestamp": "01:15",
        "speaker": "候选人",
        "content": "当然！我们实现了几个关键功能，包括用户身份验证、带有搜索和筛选功能的产品目录浏览、购物车功能、与Stripe的支付集成、订单更新的推送通知，以及为更好用户体验的离线数据缓存。"
      },
      {
        "timestamp": "01:45",
        "speaker": "AI面试官",
        "content": "太棒了！您能告诉我在使用React Native工作时遇到的挑战以及您是如何克服这些挑战的吗？"
      },
      {
        "timestamp": "02:10",
        "speaker": "候选人",
        "content": "一个主要挑战是性能优化，特别是处理大型产品列表。我们通过实现FlatList并进行适当的键提取以及对列表项使用React.memo来解决这个问题。另一个挑战是处理不同设备的屏幕尺寸和方向，我们使用响应式设计原则和在多个设备模拟器上进行测试来解决这个问题。"
      }
    ]
  },
  "proctoring": {
    "score": 77,
    "description": "此得分介于0至100%之间，根据与作弊相关的违规行为持续时间计算得出。例如，切换标签页、眼部移动等。得分越高，表现越好。",
    "violations": [
      {
        "type": "眼部移动",
        "description": "候选人眼睛离开屏幕1次，每次持续时间较长。"
      }
    ]
  },
  "about": {
    "name": "王小明",
    "description": "一位机器学习爱好者，拥有扎实的学术记录和丰富的行业以及研究经验，专业领域涵盖数据科学、自然语言处理和计算机视觉。该候选人在生成式AI、向量数据库和深度推荐系统等前沿项目中发挥了引领作用，同时保持着稳健的CI/CD实践。凭借横跨硕士研究、多个研究助理职位和实际行业实施的背景，这位专业人士善于应对跨职能挑战并交付创新的AI解决方案。",
    "resumeUrl": "/files/resume.pdf",
    "resumeFilename": "王小明_简历.pdf"
  },
  "candidateSkills": {
    "skills": [
      "NLP",
      "生成式AI/提示工程",
      "可解释AI",
      "RAG",
      "聚类",
      "计算机视觉",
      "Scrum",
      "CI/CD",
      "TensorFlow",
      "PyTorch",
      "Python",
      "Java",
      "SQL",
      "Docker",
      "Kubernetes",
      "深度学习",
      "推荐系统",
      "向量数据库",
      "数据科学",
      "机器学习"
    ],
    "showMoreText": "+40 更多"
  },
  "workExperience": {
    "experiences": [
      {
        "id": "bytedance",
        "position": "大模型训练工程师",
        "company": "字节跳动",
        "companyIcon": "https://dnu-cdn.xpertiise.com/common/%E5%AD%97%E8%8A%82%E8%B7%B3%E5%8A%A8.png",
        "startDate": "2022年11月",
        "endDate": "至今",
        "duration": "2年9个月",
        "responsibilities": [
          "负责大规模语言模型预训练数据的清洗、去重和质量评估，处理TB级别的训练数据集。",
          "参与豆包大模型的数据工程流程优化，设计并实现高效的数据预处理管道，提升训练效率30%。",
          "负责多模态模型训练数据的标注质量管控，建立自动化质量检测系统，确保数据标注准确率达到95%以上。",
          "参与分布式训练系统的性能优化，协助解决大模型训练中的数据并行和模型并行技术难题。"
        ],
        "techStacks": [
          "大语言模型",
          "数据预处理",
          "分布式训练",
          "PyTorch",
          "CUDA",
          "数据标注",
          "质量评估"
        ],
        "showReadMore": true
      },
      {
        "id": "drimco",
        "position": "数据科学家及硕士论文研究",
        "company": "DRIMCo GmbH",
        "companyIcon": "https://dummyimage.com/64x64/059669/ffffff?text=DR",
        "startDate": "2020年8月",
        "endDate": "2021年9月",
        "duration": "1年1个月",
        "responsibilities": [
          "处理命名实体识别、联邦学习和持续/终身学习任务。",
          "支持使用Git、Scrum、JIRA、MLflow、Docker、Neo4j和Sphinx的研究和开发项目。"
        ],
        "techStacks": [
          "命名实体识别",
          "联邦学习",
          "持续学习",
          "终身学习",
          "Git",
          "Scrum",
          "JIRA",
          "MLflow",
          "Docker",
          "Neo4j",
          "Sphinx"
        ]
      },
      {
        "id": "research-assistant",
        "position": "研究助理（学生工）",
        "company": "德国大学研究所",
        "companyIcon": "https://dummyimage.com/64x64/7C3AED/ffffff?text=UNI",
        "startDate": "2018年11月",
        "endDate": "2019年9月",
        "duration": "10个月",
        "responsibilities": [
          "协助进行机器学习和深度学习相关的研究项目。",
          "参与数据收集、预处理和模型训练工作。",
          "协助撰写研究报告和学术论文。"
        ],
        "techStacks": [
          "Python",
          "机器学习",
          "深度学习",
          "数据预处理",
          "学术研究"
        ]
      }
    ]
  },
  "education": {
    "educations": [
      {
        "id": "sjtu-master",
        "degree": "计算机科学与技术硕士",
        "major": "人工智能方向",
        "school": "上海交通大学",
        "schoolIcon": "https://dnu-cdn.xpertiise.com/common/bd6179ea-5014-4a15-8f2c-0ed5e463b0e5.png",
        "startDate": "2018年9月",
        "endDate": "2021年6月",
        "duration": "2年9个月",
        "description": "专注于机器学习和深度学习研究，师从国际知名教授，参与多项国家级AI科研项目。",
        "achievements": [
          "获得上海交通大学优秀研究生奖学金",
          "在顶级期刊发表机器学习相关论文2篇",
          "参与国家自然科学基金重点项目"深度学习理论与应用"",
          "担任研究生会学术部部长，组织多场国际学术会议"
        ]
      },
      {
        "id": "harvard-master",
        "degree": "数据科学硕士",
        "major": "机器学习与统计学",
        "school": "哈佛大学",
        "schoolIcon": "https://dnu-cdn.xpertiise.com/common/3ba95e44-3601-4526-b816-a20acce9998d.png",
        "startDate": "2016年9月",
        "endDate": "2018年5月",
        "duration": "1年8个月",
        "description": "在世界顶尖学府深入学习数据科学前沿理论和实践，与来自全球的优秀学者共同探索AI领域前沿问题。",
        "achievements": [
          "以优异成绩（GPA 3.9/4.0）毕业，获得院长嘉奖",
          "获得哈佛大学Merit-Based全额奖学金",
          "在IEEE国际会议上发表深度学习算法优化论文",
          "参与Google AI实验室合作项目，研究自然语言处理算法"
        ]
      }
    ]
  }
}
```

## API 接口建议

### 获取面试报告详情
```
GET /api/interview-reports/{reportId}

Response:
{
  "code": 200,
  "message": "success",
  "data": InterviewReportData
}
```

## 重要说明

1. **图标处理**: `iconName` 字段提供图标名称，前端会根据此名称加载对应的 Tabler Icons
2. **图片优先**: 如果 `image` 字段存在，优先使用图片而非图标
3. **文件URL**: 所有文件URL（头像、简历、视频等）应返回完整的可访问URL
4. **时间格式**: 日期时间建议使用 `YYYY年MM月` 格式（中文界面）
5. **评分范围**: AI匹配得分和监考得分建议使用 0-100 的数值范围
6. **可选字段**: 带 `?` 的字段为可选，后端可根据实际情况返回

## 前端集成说明

前端已经实现了完整的数据展示逻辑，只需要将 API 返回的数据替换掉现有的 mock 数据即可实现功能对接。

所有图标和样式已经预配置完成，确保按照此数据结构返回即可获得最佳显示效果。
