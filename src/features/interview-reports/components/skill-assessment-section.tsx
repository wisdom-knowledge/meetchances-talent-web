import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type SkillItem } from '../data/skills-data'

interface SkillAssessmentSectionProps {
  skills: SkillItem[]
}

// 技能等级样式映射
const levelVariants = {
  experienced: 'bg-green-100 text-green-800 border-green-300',
  senior: 'bg-green-100 text-green-800 border-green-300', 
  excellent: 'bg-green-100 text-green-800 border-green-300',
  high: 'bg-green-100 text-green-800 border-green-300',
} as const

export default function SkillAssessmentSection({ skills }: SkillAssessmentSectionProps) {
  return (
    <div className='mb-8'>
      <h2 className='text-xl font-semibold text-gray-900 mb-4'>
      技能考核综合结果
      </h2>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {skills.map((skill) => (
          <div key={skill.id} className='border flex flex-row gap-6 p-4 rounded-xl items-center'>
            {/* 技能图标 */}
            <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center'>
              {skill.image ?
                <img src={skill.image} alt={skill.name} /> :
                skill.icon}
            </div>

            {/* 技能信息 */}
            <div className='space-y-1 flex-1'>
              <h3 className='font-medium text-gray-900 truncate'>
                {skill.name}
              </h3>
              <p className='text-sm text-gray-500'>
                {skill.description}
              </p>
            </div>
            
            {/* 技能等级标签 */}
            <div className='flex-shrink-0'>
              <Badge 
                variant='outline'
                className={cn(levelVariants[skill.variant], 'text-xs')}
              >
                {skill.level}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


