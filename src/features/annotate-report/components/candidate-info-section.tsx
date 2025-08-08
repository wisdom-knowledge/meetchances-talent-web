import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formLabelClass, formRowClass, formContainerClass } from '@/lib/form-styles'
import { Button } from '@/components/ui/button'

interface CandidateInfoSectionProps {
  candidate: {
    name: string
    avatar: string
    school: string
    degree: string
    position: string
    workYears: number
    experiences: string[]
    skills: string[]
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
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>{candidate.name}</h2>
          <div className='text-sm text-gray-600 mt-1'>
            {candidate.school} · {candidate.degree}
          </div>
          <div className='text-sm text-gray-600'>
            {candidate.position} · {candidate.workYears} 年工作经验
          </div>
        </div>
      </div>

      <div className={cn(formContainerClass)}>
        {/* 工作经历（公司） */}
        <div className={cn(formRowClass)}>
          <span className={cn(formLabelClass)}>工作经历:</span>
          <div className='flex items-center gap-2 flex-wrap'>
            {candidate.experiences.map((exp, index) => (
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

        {/* 专业技能（标签） */}
        <div className={cn(formRowClass)}>
          <span className={cn(formLabelClass)}>专业技能:</span>
          <div className='flex flex-wrap gap-2'>
            {candidate.skills.map((skill, index) => (
              <Badge
                key={index}
                variant='outline'
                className='bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 px-3 py-1 text-sm'
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <Button variant='link' className='text-blue-600 px-0 py-1 h-auto text-sm mt-2'>查看完整简历</Button>
      </div>
    </div>
  )
}


