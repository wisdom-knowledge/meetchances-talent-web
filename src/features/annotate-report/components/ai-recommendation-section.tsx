import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  IconChecklist,
  IconGauge,
  IconUserCheck,
  IconClockHour2,
  IconChartHistogram,
} from '@tabler/icons-react'

interface MetricItem {
  category: string
  title: string
  value: string | number
  note?: string
  icon?: 'tasks' | 'aiScore' | 'humanScore' | 'medianDuration' | 'zScore' | string
  numericValue?: number
  averageValue?: number
  betterDirection?: 'higher' | 'lower'
}

export interface AiRecommendationData {
  score: number
  metrics: MetricItem[]
  footerNote: string
}

interface AiRecommendationSectionProps {
  data: AiRecommendationData
}

function getScoreColorClass(score: number): { text: string; colorClass: string } {
  if (score >= 90) return { text: '卓越', colorClass: 'text-emerald-600' }
  if (score >= 75) return { text: '优秀', colorClass: 'text-green-600' }
  if (score >= 60) return { text: '良好', colorClass: 'text-yellow-600' }
  return { text: '一般', colorClass: 'text-red-600' }
}

export default function AiRecommendationSection({ data }: AiRecommendationSectionProps) {
  const { text, colorClass } = getScoreColorClass(data.score)

  const renderIcon = (icon?: MetricItem['icon']) => {
    const className = 'text-muted-foreground h-4 w-4'
    switch (icon) {
      case 'tasks':
        return <IconChecklist className={className} />
      case 'aiScore':
        return <IconGauge className={className} />
      case 'humanScore':
        return <IconUserCheck className={className} />
      case 'medianDuration':
        return <IconClockHour2 className={className} />
      case 'zScore':
        return <IconChartHistogram className={className} />
      default:
        return <IconGauge className={className} />
    }
  }

  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />

      {/* 顶部总分与说明 */}
      <div className='mb-4 flex items-center gap-2'>
        <span className='text-gray-700 text-base font-medium'>AI 推荐分：</span>
        <span className={`text-2xl font-bold ${colorClass}`}>{data.score}</span>
        <span className={`text-base font-semibold ${colorClass}`}>{text}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs cursor-default'>i</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>综合产量、质量与效率等指标计算所得，范围 0-100 分。</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 指标网格（参考 dashboard 指标卡片） */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {data.metrics.map((m, idx) => (
          <Card key={idx} className='shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{m.title}</CardTitle>
              {renderIcon(m.icon)}
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{m.value}</div>
              {m.note && (
                <p className='text-muted-foreground text-xs mt-1'>{m.note}</p>
              )}
              {/* 平均值比较，仅对有平均值的指标显示 */}
              {typeof m.averageValue !== 'undefined' && typeof m.numericValue !== 'undefined' && (
                (() => {
                  const { averageValue, numericValue, betterDirection } = m
                  const isHigherBetter = betterDirection !== 'lower'
                  const isBetter = isHigherBetter
                    ? numericValue > (averageValue ?? 0)
                    : numericValue < (averageValue ?? 0)
                  const colorClass = isBetter ? 'text-green-600' : 'text-red-600'
                  let text = ''
                  if (averageValue === 0) {
                    text = numericValue === 0 ? '与平均持平' : isBetter ? '高于平均' : '低于平均'
                  } else {
                    const diffPct = Math.abs(((numericValue - averageValue) / averageValue) * 100)
                    text = `${isBetter ? '高于平均' : '低于平均'} ${diffPct.toFixed(0)}%`
                  }
                  return (
                    <p className={`text-xs mt-1 ${colorClass}`}>{text}</p>
                  )
                })()
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 底部说明文案 */}
      <p className='mt-4 text-left text-sm text-gray-500'>* {data.footerNote}</p>
    </div>
  )
}


