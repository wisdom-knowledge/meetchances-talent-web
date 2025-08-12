// 试标报告页面的 mock 数据
export interface AnnotateReportCandidateInfo {
  name: string
  avatar: string
  school: string
  degree: string
  position: string
  workYears: number
  experiences: string[]
  skills: string[]
}

export interface AnnotateReportData {
  candidate: AnnotateReportCandidateInfo
  aiRecommendation: {
    score: number
    metrics: {
      category: '产量' | '质量' | '效率'
      title: string
      value: string | number
      note?: string
      icon?: 'tasks' | 'aiScore' | 'humanScore' | 'medianDuration' | 'zScore'
      numericValue?: number
      averageValue?: number
      betterDirection?: 'higher' | 'lower'
    }[]
    footerNote: string
  }
  taskDetails: {
    id: string
    title: string
    status: 'todo' | 'in-progress' | 'done' | 'rejected'
    qualityScore: number
    aiScore: number
    durationSec: number
  }[]
}

// 随机化辅助函数
function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function roundTo1Decimal(n: number): number {
  return Math.round(n * 10) / 10
}

function formatSecondsToMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.max(0, Math.round(totalSeconds % 60))
  return `${minutes}m${seconds.toString().padStart(2, '0')}s`
}

// 说明：AI推荐分的 mock 数据按需保持静态，避免每次刷新变化

export const annotateReportData: AnnotateReportData = {
  candidate: {
    name: '李宽野',
    avatar: 'https://dnu-cdn.xpertiise.com/common/d3bd497e-cc23-42b3-a755-fea4545717bc.jpeg',
    school: '上海交通大学',
    degree: '计算机科学硕士',
    position: '大数据工程师',
    workYears: 5,
    experiences: ['美团', '阿里巴巴'],
    skills: ['Python', 'Java', 'SQL', 'Docker', 'Kubernetes', '深度学习', '推荐系统', '向量数据库', '数据科学', '机器学习'],
  },
  aiRecommendation: {
    score: 85,
    metrics: [
      { category: '产量', title: '标注任务数', value: 9, icon: 'tasks' },
      {
        category: '质量',
        title: 'AI 审核平均得分',
        value: 4.5,
        numericValue: 4.5,
        averageValue: 4.2,
        betterDirection: 'higher',
        icon: 'aiScore',
      },
      {
        category: '质量',
        title: '人工审核平均得分',
        value: 4.3,
        numericValue: 4.3,
        averageValue: 4.1,
        betterDirection: 'higher',
        icon: 'humanScore',
      },
      {
        category: '效率',
        title: '单任务耗时中位数',
        value: formatSecondsToMmSs(135),
        numericValue: 135,
        averageValue: 150,
        betterDirection: 'lower',
        icon: 'medianDuration',
      },
      {
        category: '效率',
        title: '耗时 Z-Score',
        value: -0.7,
        numericValue: -0.7,
        averageValue: 0,
        betterDirection: 'higher',
        icon: 'zScore',
      },
    ],
    footerNote: '系统检测到单任务平均粘贴 0.7 次，低于同项目均值 26%。',
  },
  taskDetails: Array.from({ length: 18 }).map((_, i) => {
    const base = 120 + i
    const presetTitles = [
      '终端数据处理与 jq',
      '进程监控与问题排查',
      '日志切分与关键字抽取',
      '接口响应时间统计',
      '异常堆栈快速定位',
      'Nginx 访问日志解析',
      '容器资源用量采样',
      'API 状态码聚合',
      '系统负载曲线拟合',
      '磁盘 IO 峰值诊断',
      '数据库慢查询分析',
      '任务队列积压预警',
      '前端报错聚合与去重',
      'CDN 命中率评估',
      '安全告警事件清洗',
      '配置变更影响排查',
      '数据抽样与可视校验',
      '埋点质量核查'
    ]
    return {
      id: `TASK-${1000 + i}`,
      title: presetTitles[i] ?? `试标样本 ${i + 1}`,
      status: (['todo', 'in-progress', 'done', 'rejected'] as const)[
        Math.floor(Math.random() * 4)
      ],
      qualityScore: roundTo1Decimal(randBetween(3.5, 5.0)),
      aiScore: roundTo1Decimal(randBetween(3.5, 5.0)),
      durationSec: Math.round(randBetween(base, base + 60)),
    }
  }),
}


