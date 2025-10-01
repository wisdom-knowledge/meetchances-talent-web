// 面试评价问题配置
export interface RatingQuestion {
  id: string
  label: string
  required?: boolean
}

// 主要评分问题
export const mainQuestion: RatingQuestion = {
  id: 'overall',
  label: '整体评分',
  required: true,
}

// 细分评价问题（当总评分 <= 4 时展示）
export const detailQuestions: RatingQuestion[] = [
  {
    id: 'flow',
    label: '面试过程流畅、无卡顿',
    required: true,
  },
  {
    id: 'expression',
    label: '面试官表达自然、理解准确',
    required: true,
  },
  {
    id: 'relevance',
    label: '面试问题与岗位和您的背景相符',
    required: true,
  },
]

