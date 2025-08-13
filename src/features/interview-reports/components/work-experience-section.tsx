import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

interface WorkExperienceItem {
  id: string
  position: string
  company: string
  companyIcon: string
  startDate: string
  endDate: string
  duration: string
  responsibilities: string[]
  techStacks: string[]
  showReadMore?: boolean
}

interface WorkExperienceData {
  experiences: WorkExperienceItem[]
}

interface WorkExperienceSectionProps {
  data: WorkExperienceData
}

export default function WorkExperienceSection({ data }: WorkExperienceSectionProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />

      <div className='space-y-6'>
        {/* 标题 */}
        <h2 className='text-xl font-semibold text-gray-900'>
          工作经历
        </h2>

        {/* 工作经历时间轴 */}
        <div className='relative'>
          {/* 时间轴线 */}
          <div className='absolute left-4 top-6 bottom-0 w-0.5 bg-blue-200'></div>

          <div className='space-y-8'>
            {data.experiences.map((experience) => {
              const isExpanded = expandedItems.includes(experience.id)
              const displayedResponsibilities = isExpanded || !experience.showReadMore
                ? experience.responsibilities
                : experience.responsibilities.slice(0, 2)

              return (
                <div key={experience.id} className='relative'>
                  {/* 时间轴圆点 */}
                  <div className='absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-sm'></div>

                  {/* 工作经历卡片 */}
                  <div className='ml-12 bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-4'>
                        {/* 公司图标 */}
                        <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0'>
                          <img
                            src={experience.companyIcon}
                            alt={`${experience.company} logo`}
                            className='w-8 h-8 object-contain'
                          />
                        </div>

                        {/* 职位和公司信息 */}
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                            {experience.position} at {experience.company}
                          </h3>
                        </div>
                      </div>

                      {/* 时间信息 */}
                      <div className='text-right text-sm text-gray-600 flex-shrink-0'>
                        <div className='font-medium'>
                          {experience.startDate} - {experience.endDate}
                        </div>
                        <div className='text-gray-500'>
                          {experience.duration}
                        </div>
                      </div>
                    </div>

                    {/* 工作职责 */}
                    <div className='mb-4'>
                      <h4 className='text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider'>
                        主要职责
                      </h4>
                      <ul className='space-y-1'>
                        {displayedResponsibilities.map((responsibility, idx) => (
                          <li key={idx} className='text-sm text-gray-700 leading-relaxed flex items-start'>
                            <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0'></span>
                            {responsibility}
                          </li>
                        ))}
                      </ul>

                      {/* 展开/收起按钮 */}
                      {experience.showReadMore && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleExpanded(experience.id)}
                          className='text-blue-600 hover:text-blue-600 hover:bg-blue-50 px-0 py-1 h-auto text-sm mt-2'
                        >
                          {isExpanded ? '收起' : '阅读更多'}
                        </Button>
                      )}
                    </div>

                    {/* 技术栈 */}
                    <div>
                      <h4 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider'>
                        使用的技术栈
                      </h4>
                      <div className='flex flex-wrap gap-2'>
                        {experience.techStacks.map((tech, idx) => (
                          <Badge
                            key={idx}
                            variant='outline'
                            className='bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 px-3 py-1 text-sm'
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
