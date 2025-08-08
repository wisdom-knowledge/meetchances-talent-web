import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface CandidateSkillsData {
  skills: string[]
  showMoreText: string
}

interface CandidateSkillsSectionProps {
  data: CandidateSkillsData
}

export default function CandidateSkillsSection({ data }: CandidateSkillsSectionProps) {
  const [showAll, setShowAll] = useState(false)
  
  // 默认显示的技能数量
  const defaultDisplayCount = 8
  const displayedSkills = showAll ? data.skills : data.skills.slice(0, defaultDisplayCount)
  const hasMore = data.skills.length > defaultDisplayCount

  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />
      
      <div className='space-y-6'>
        {/* 标题 */}
        <h2 className='text-xl font-semibold text-gray-900'>
          技能
        </h2>
        
        {/* 技能标签 */}
        <div className='flex flex-wrap gap-2'>
          {displayedSkills.map((skill, index) => (
            <Badge 
              key={index}
              variant='outline'
              className='bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 px-3 py-1 text-sm'
            >
              {skill}
            </Badge>
          ))}
          
          {/* 显示更多按钮 */}
          {hasMore && !showAll && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowAll(true)}
              className='text-blue-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 h-auto text-sm'
            >
              {data.showMoreText}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
