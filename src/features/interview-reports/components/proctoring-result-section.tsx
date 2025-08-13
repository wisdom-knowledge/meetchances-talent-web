import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ViolationItem {
  type: string
  description: string
  count?: number
}

interface ProctoringResultData {
  score: number
  description: string
  violations: ViolationItem[]
}

interface ProctoringResultSectionProps {
  data: ProctoringResultData
}

export default function ProctoringResultSection({ data }: ProctoringResultSectionProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />

      <div className='space-y-6'>
        {/* 标题 */}
        <div>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            AI面试监考结果
          </h2>

          {/* 描述 */}
          <p className='text-sm text-gray-600 leading-relaxed mb-6'>
            {data.description}
          </p>
        </div>

        {/* 违规详情 */}
        {data.violations.length > 0 && (
          <div className='space-y-3'>
            {data.violations.map((violation, index) => (
              <div key={index} className='text-sm text-gray-700'>
                <span className='font-medium'>{violation.type}：</span>
                <span className='ml-1'>{violation.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* 最终得分 */}
        <div className={cn(
          'inline-flex items-center gap-3 px-4 py-3 rounded-lg border',
          getScoreBgColor(data.score)
        )}>
          <span className='text-sm font-medium text-gray-900'>
            最终监考得分：
          </span>
          <span className={cn('text-2xl font-bold', getScoreColor(data.score))}>
            {data.score}%
          </span>
        </div>
      </div>
    </div>
  )
}
