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

// 生成带随机偏移的均值与当前值
const avgAiScore = roundTo1Decimal(randBetween(3.8, 4.6))
const curAiScore = roundTo1Decimal(avgAiScore + randBetween(-0.4, 0.4))

const avgHumanScore = roundTo1Decimal(randBetween(3.7, 4.5))
const curHumanScore = roundTo1Decimal(avgHumanScore + randBetween(-0.4, 0.4))

const avgMedianSec = Math.round(randBetween(120, 180)) // 2-3 分钟
const curMedianSec = Math.round(avgMedianSec + randBetween(-30, 30))

const avgZ = 0
const curZ = roundTo1Decimal(randBetween(-1.2, 1.2))

export const annotateReportData: AnnotateReportData = {
  candidate: {
    name: '王小明',
    avatar: 'https://dnu-cdn.xpertiise.com/common/105f2ec8-ce22-402e-bf73-6df175d98187.jpg',
    school: '上海交通大学',
    degree: '计算机科学硕士',
    position: '前端工程师',
    workYears: 5,
    experiences: ['美团', '阿里巴巴'],
    skills: ['React', 'TypeScript', 'Node.js', 'CSS', 'TailwindCSS', 'Vite', 'Zod'],
  },
  aiRecommendation: {
    score: Math.round(randBetween(70, 95)),
    metrics: [
      { category: '产量', title: '标注任务数', value: Math.round(randBetween(6, 14)), icon: 'tasks' },
      {
        category: '质量',
        title: 'AI 审核平均得分',
        value: curAiScore,
        numericValue: curAiScore,
        averageValue: avgAiScore,
        betterDirection: 'higher',
        icon: 'aiScore',
      },
      {
        category: '质量',
        title: '人工审核平均得分',
        value: curHumanScore,
        numericValue: curHumanScore,
        averageValue: avgHumanScore,
        betterDirection: 'higher',
        icon: 'humanScore',
      },
      {
        category: '效率',
        title: '单任务耗时中位数',
        value: formatSecondsToMmSs(curMedianSec),
        numericValue: curMedianSec,
        averageValue: avgMedianSec,
        betterDirection: 'lower',
        icon: 'medianDuration',
      },
      {
        category: '效率',
        title: '耗时 Z-Score',
        value: curZ,
        numericValue: curZ,
        averageValue: avgZ,
        betterDirection: 'lower',
        icon: 'zScore',
      },
    ],
    footerNote: '系统检测到单任务平均粘贴 0.7 次，低于同项目均值 26%。',
  },
  taskDetails: Array.from({ length: 18 }).map((_, i) => {
    const base = 120 + i
    return {
      id: `TASK-${1000 + i}`,
      title: `试标样本 ${i + 1}`,
      status: (['todo', 'in-progress', 'done', 'rejected'] as const)[
        Math.floor(Math.random() * 4)
      ],
      qualityScore: roundTo1Decimal(randBetween(3.5, 5.0)),
      aiScore: roundTo1Decimal(randBetween(3.5, 5.0)),
      durationSec: Math.round(randBetween(base, base + 60)),
    }
  }),
}


