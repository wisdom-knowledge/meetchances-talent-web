import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formLabelClass, formRowClass, formContainerClass } from '@/lib/form-styles'

interface CandidateInfoSectionProps {
  candidate: {
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
}



export default function CandidateInfoSection({ candidate }: CandidateInfoSectionProps) {
  return (
    <div className='mb-6'>
      {/* 头像和姓名 */}
      <div className='flex items-center gap-4 mb-6'>
        <Avatar className='h-16 w-16'>
          <AvatarImage src={candidate.avatar} alt={candidate.name} />
          <AvatarFallback className='text-lg font-semibold'>
            {candidate.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <h2 className='text-2xl font-bold text-gray-900'>{candidate.name}</h2>
      </div>

      <div className={cn(formContainerClass)}>
        {/* 工作年限 */}
        <div className={cn(formRowClass)}>
          <span className={cn(formLabelClass)}>工作年限:</span>
          <div className='flex items-center gap-2'>
          {candidate.workYears} 年
            {candidate.workExperience.map((exp, index) => (
              <Badge 
                key={index}
                variant='outline' 
                className='border-orange-300 bg-orange-50 text-orange-700'
              >
                {exp}
              </Badge>
            ))}
          </div>
        </div>

        {/* 项目历史 */}
        <div className={cn(formRowClass)}>
          <span className={cn(formLabelClass)}>项目历史:</span>
          <div className='flex flex-wrap gap-2'>
            {candidate.projectHistory.map((project, index) => (
              <div key={index} className='flex items-center gap-1'>
                <Badge className='bg-green-100 text-green-800 border-green-300'>
                  {project.name} {project.skills}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* AI 匹配得分 */}
        <div className={cn(formRowClass)}>
          <span className={cn(formLabelClass)}>AI 匹配得分:</span>
          <div className='flex items-center gap-2'>
            <div className='relative w-20 h-3 bg-gray-200 rounded-full overflow-hidden'>
              {/* 动态进度条和自定义渐变需要使用inline style */}
              <div 
                className='h-full transition-all duration-300'
                style={{ 
                  width: `${Math.min(100, Math.max(0, candidate.aiMatchScore))}%`,
                  background: 'linear-gradient(to right, #4E02E4, #C994F7)'
                }}
              />
            </div>
            <span className='text-lg font-bold text-blue-600'>
              {candidate.aiMatchScore.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
