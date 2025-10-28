import { api } from '@/lib/api'

export interface StudyTaskItem {
  task_id: number
  title: string
  link: string
}

export interface StudyModuleItem {
  id: number
  title: string
  desc: string
  // 1: 未开始 2: 进行中 3: 已完成
  status: 1 | 2 | 3
  tasks: StudyTaskItem[]
}

export type StudyModulesResponse = StudyModuleItem[]

export const MOCK_STUDY_MODULES: StudyModulesResponse = [
  {
    id: 1,
    title: '模块1',
    desc: '认识数据标注',
    status: 3,
    tasks: [
      { task_id: 1, title: '欢迎加入标注专家训练营！', link: 'https://meetchances.feishu.cn/wiki/BTZqw5xC4isRtPkbbcecguUDn7c' },
      { task_id: 2, title: '认识数据标注', link: 'https://meetchances.feishu.cn/wiki/C0JwwZbsyiZrRDk787AcRTX3nJw' },
      { task_id: 3, title: '1.1', link: 'https://meetchances.feishu.cn/wiki/PcV0wpFoYihXuKkVOZQc5W0Knmb' },
      { task_id: 4, title: '1.2', link: 'https://meetchances.feishu.cn/wiki/KWq3wriWAiDAzekBCAdck7jUnef' },
      { task_id: 5, title: '小测环节', link: 'https://meetchances.feishu.cn/wiki/OZcWw6rkjiOvvBkWHPfc1NObn7d' },
    ],
  },
  {
    id: 2,
    title: '模块2',
    desc: '大模型标注范式：SFT，RLHF，RLVR',
    status: 3,
    tasks: [
      { task_id: 6, title: '模块 2｜大模型标注范式：SFT，RLHF，RLVR', link: 'https://meetchances.feishu.cn/wiki/A5xvw64qliwoiEkeh2IcNUpjnIb' },
      { task_id: 7, title: '单元1|SFT', link: 'https://meetchances.feishu.cn/wiki/OZcWw6rkjiOvvBkWHPfc1NObn7d' },
      { task_id: 8, title: '单元1|SFT小测验', link: 'https://meetchances.feishu.cn/wiki/JbZswRvjki3TLHk1LMzc9KJXnkc' },
      { task_id: 9, title: '单元2|RLHF', link: 'https://meetchances.feishu.cn/wiki/HR5nw1EkaikO9VktTXBcCHg3ngg' },
      { task_id: 10, title: '单元2|RLHF小测验', link: 'https://meetchances.feishu.cn/wiki/Du4XwnS69iYRuQkIHEfcwtWUnRf' },
      { task_id: 11, title: '单元3|RLVR', link: 'https://meetchances.feishu.cn/wiki/GPOaw2qIUiLt4lkcbnYcRFTgntf' },
      { task_id: 12, title: '单元3|RLVR小测验', link: 'https://meetchances.feishu.cn/wiki/XpQuw5ifzi57M0kb5v5c5cIcnVf' },
    ],
  },
  {
    id: 3,
    title: '模块3',
    desc: '好数据的标准',
    status: 2,
    tasks: [
      { task_id: 13, title: '模块 3｜好数据的标准', link: 'https://meetchances.feishu.cn/wiki/Q62IwGzhiiyRtGkeT4OcynRunMb' },
      { task_id: 14, title: '小测环节', link: 'https://meetchances.feishu.cn/wiki/GafRwoUKbi7TmckIgLhcbS0InSb' },
    ],
  },
  {
    id: 4,
    title: '模块4',
    desc: 'Rubric基础详解+实操',
    status: 1,
    tasks: [
      { task_id: 15, title: '模块 4｜Rubric 详解 + 实操', link: 'https://meetchances.feishu.cn/wiki/GILmwo1epiLhYLkf6ZgcfklanYd' },
      { task_id: 16, title: '小测环节', link: 'https://meetchances.feishu.cn/wiki/RqoFw6MTviNgOgkJYrzcA378ngh' },
    ],
  },
]

export async function fetchStudyModules(): Promise<StudyModulesResponse> {
  try {
    const res = await api.get<StudyModulesResponse>('/talent/study')
    if (Array.isArray(res)) return res as unknown as StudyModulesResponse
  } catch (_e) {
    // ignore and fallback
  }
  return MOCK_STUDY_MODULES
}

// ===== 更新学习状态（POST /talent/study）=====
export interface UpdateStudyStatusParams {
  id: number
  status: 1 | 2 | 3
}

export async function updateStudyStatus(params: UpdateStudyStatusParams): Promise<boolean> {
  try {
    // 后端尚未实现，先直接返回成功，同时尝试发起请求以便后端就绪后自动对接
    void api.post('/talent/study', params).catch(() => {})
    return true
  } catch (_e) {
    return false
  }
}


