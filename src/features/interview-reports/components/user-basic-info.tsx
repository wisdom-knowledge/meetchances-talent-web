import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getUserAvatarUrl } from '@/utils/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { InterviewReportData } from '../data/interview-report-types.ts'

interface Props {
  data: InterviewReportData
  userId: number | undefined
}

// 候选人信息卡片骨架屏组件
export function CandidateInfoSkeleton() {
  return (
    <div className='flex items-center gap-4 rounded-lg bg-gray-50 p-4'>
      {/* 头像骨架 */}
      <Skeleton className='h-16 w-16 flex-shrink-0 rounded-full' />

      {/* 候选人信息骨架 */}
      <div className='min-w-0 flex-1'>
        {/* 姓名骨架 */}
        <Skeleton className='mb-2 h-7 w-24' />

        {/* 面试信息骨架 */}
        <div className='space-y-1'>
          <div className='flex items-center gap-4 text-sm'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-24' />
          </div>
        </div>
      </div>

      {/* 右侧分数区域骨架 */}
      <div className='flex flex-col items-center gap-1'>
        <Skeleton className='h-10 w-16 rounded' />
        <Skeleton className='h-3 w-12' />
      </div>
    </div>
  )
}

export function CandidateInfoCard({ data, userId }: Props) {
  const candidateName = data.resume_name || '候选人'

  // 获取姓名的第一个字符作为头像显示
  const avatarText = candidateName.charAt(0)

  const overall = data.overall_score

  // 计算面试时长和时间（从对话记录中获取）
  const getInterviewInfo = () => {
    const detailText = data.ai_interview?.detail_text
    if (!detailText || detailText.length === 0) {
      return {
        duration: '--',
        date: '--',
        startTime: '--',
      }
    }

    // 获取第一条和最后一条记录的时间戳
    const firstRecord = detailText[0]
    const lastRecord = detailText[detailText.length - 1]

    const firstTime = firstRecord.metadata?.t_sec || 0
    const lastTime = lastRecord.metadata?.t_sec || 0
    const durationSeconds = lastTime - firstTime

    // 计算时长（分钟）
    const durationMinutes = Math.round(durationSeconds / 60)
    const duration = durationMinutes > 0 ? `${durationMinutes}分钟` : '--'

    // 获取面试日期（从第一条记录的时间戳）
    const firstTimestamp = firstRecord.metadata?.ts
    let date = '--'
    if (firstTimestamp) {
      try {
        const dateObj = new Date(firstTimestamp)
        date = dateObj
          .toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
          .replace(/\//g, '-')
      } catch (_e) {
        date = '--'
      }
    }

    return { duration, date }
  }

  const { duration, date } = getInterviewInfo()

  return (
    <div className='flex items-start gap-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
      {/* 头像 */}
      <Avatar className='h-20 w-20 flex-shrink-0'>
        <AvatarFallback className='bg-blue-100 text-xl font-medium text-blue-600'>
          {data.avatar_url ? (
            <img
              src={getUserAvatarUrl({ userId, avatarUrl: data.avatar_url })}
              alt={candidateName}
              className='h-full w-full object-cover'
            />
          ) : (
            avatarText
          )}
        </AvatarFallback>
      </Avatar>

      {/* 候选人基本信息 */}
      <div className='min-w-0 flex-1'>
        {/* 姓名和综合得分 */}
        <div className='mb-4 flex items-center gap-4'>
          <h3 className='text-2xl font-bold text-gray-900'>{candidateName}</h3>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-600'>综合得分:</span>
            <span
              className={`text-3xl font-bold ${(() => {
                const score = overall.score || 0
                if (score >= 90) return 'text-red-500' // 优秀 - 使用红色突出显示
                if (score >= 80) return 'text-orange-500' // 良好
                if (score >= 60) return 'text-yellow-500' // 及格
                return 'text-gray-500' // 不及格
              })()}`}
            >
              {overall.score}
            </span>
          </div>
        </div>

        {/* 面试详细信息 - 响应式布局 */}
        <div className='grid grid-cols-1 gap-3 text-sm md:grid-cols-3 md:gap-8'>
          <div className='flex gap-1'>
            <span className='font-medium text-gray-500'>面试岗位:</span>
            <span className='font-semibold text-gray-900'>{data.job_name || '—'}</span>
          </div>
          <div className='flex gap-1'>
            <span className='font-medium text-gray-500'>面试时长:</span>
            <span className='font-semibold text-gray-900'>{duration}</span>
          </div>
          <div className='flex gap-1'>
            <span className='font-medium text-gray-500'>面试时间:</span>
            <span className='font-semibold text-gray-900'>{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
