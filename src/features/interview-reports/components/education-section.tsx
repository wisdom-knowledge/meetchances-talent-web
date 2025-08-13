import { Separator } from '@/components/ui/separator'

interface EducationItem {
  id: string
  degree: string
  major: string
  school: string
  schoolIcon: string
  startDate: string
  endDate: string
  duration: string
  description?: string
  achievements?: string[]
}

interface EducationData {
  educations: EducationItem[]
}

interface EducationSectionProps {
  data: EducationData
}

export default function EducationSection({ data }: EducationSectionProps) {
  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />

      <div className='space-y-6'>
        {/* 标题 */}
        <h2 className='text-xl font-semibold text-gray-900'>
          教育经历
        </h2>

        {/* 教育经历时间轴 */}
        <div className='relative'>
          {/* 时间轴线 */}
          <div className='absolute left-4 top-6 bottom-0 w-0.5 bg-blue-200'></div>

          <div className='space-y-8'>
            {data.educations.map((education) => (
              <div key={education.id} className='relative'>
                {/* 时间轴圆点 */}
                <div className='absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-sm'></div>

                {/* 教育经历卡片 */}
                <div className='ml-12 bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-4'>
                      {/* 学校图标 */}
                      <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0'>
                        <img
                          src={education.schoolIcon}
                          alt={`${education.school} logo`}
                          className='w-8 h-8 object-contain'
                        />
                      </div>

                      {/* 学位和学校信息 */}
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                          {education.degree}{education.major && ` · ${education.major}`}
                        </h3>
                        <p className='text-base text-gray-700 font-medium'>
                          {education.school}
                        </p>
                      </div>
                    </div>

                    {/* 时间信息 */}
                    <div className='text-right text-sm text-gray-600 flex-shrink-0'>
                      <div className='font-medium'>
                        {education.startDate} - {education.endDate}
                      </div>
                      <div className='text-gray-500'>
                        {education.duration}
                      </div>
                    </div>
                  </div>

                  {/* 描述信息 */}
                  {education.description && (
                    <div className='mb-4'>
                      <p className='text-sm text-gray-700 leading-relaxed'>
                        {education.description}
                      </p>
                    </div>
                  )}

                  {/* 成就和荣誉 */}
                  {education.achievements && education.achievements.length > 0 && (
                    <div>
                      <h4 className='text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider'>
                        主要成就
                      </h4>
                      <ul className='space-y-1'>
                        {education.achievements.map((achievement, idx) => (
                          <li key={idx} className='text-sm text-gray-700 leading-relaxed flex items-start'>
                            <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0'></span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
