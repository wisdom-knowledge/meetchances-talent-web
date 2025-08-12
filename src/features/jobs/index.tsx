import { useState } from 'react'
// import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
// import { TopNav } from '@/components/layout/top-nav'
// import { ProfileDropdown } from '@/components/profile-dropdown'
// import { Search } from '@/components/search'
import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExploreJobs } from './mockData.ts'
import { JobType } from '@/constants/explore'
import type { Job } from '@/types/solutions'
import { cn } from '@/lib/utils'
import { IconArrowLeft } from '@tabler/icons-react'

export default function JobsListPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [isDetailMounted, setIsDetailMounted] = useState(false)

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job)
    setIsDetailMounted(true)
    setIsDetailVisible(true)
  }

  const handleCollapse = () => {
    setIsDetailVisible(false)
    window.setTimeout(() => {
      setIsDetailMounted(false)
      setSelectedJob(null)
    }, 300)
  }

  return (
    <>


      <Main fixed>
        <div className='mb-2 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>职位列表</h1>
            <p className='text-muted-foreground'>寻找与你匹配的远程/合约职位</p>
          </div>
        </div>

        <div className='relative flex h-[calc(100vh-4rem)] flex-col gap-6 lg:flex-row -mb-8'>
          {/* 左侧：职位列表 */}
          <div className={cn('h-full lg:h-auto flex-1')}>
            <ScrollArea className='h-full pr-1 p-2'>
              <ul className='space-y-2'>
                {ExploreJobs.map((job: Job) => {
                  const isActive = selectedJob?.id === job.id
                  return (
                    <li key={job.id}>
                      <div
                        role='button'
                        tabIndex={0}
                        onClick={() => handleSelectJob(job)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleSelectJob(job)
                        }}
                        className={
                          'w-full cursor-pointer rounded-md border p-4 text-left transition-colors hover:bg-accent ' +
                          (isActive ? 'border-primary ring-primary/30' : 'border-border')
                        }
                      >
                        <div className='flex items-center justify-between gap-4'>
                          <div>
                            <h3 className='font-medium'>{job.title}</h3>
                            <p className='text-xs text-muted-foreground'>{job.company}</p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='secondary'>￥{job.salaryRange[0]}</Badge>
                            <Badge variant='outline'>
                              ￥{job.salaryRange[0]} - ￥{job.salaryRange[1]} / 小时
                            </Badge>
                            <Badge variant='secondary'>
                              {job.jobType === JobType.PART_TIME ? '兼职' : '全职'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </div>

          {/* 右侧：职位详情（外层相对，内层绝对，-top 盖住 Header，实现纵向全屏） */}
          {isDetailMounted && (
            <div className='relative h-full flex-1'>
              <div
                className={
                  'absolute left-0 right-0 -top-16 bottom-0 -mt-6 z-50 bg-background border-l shadow-xl transition-transform duration-300 ' +
                  (isDetailVisible ? 'translate-x-0 p-6' : 'translate-x-full p-0 pointer-events-none')
                }
              >
                {selectedJob && (
                  <div className='h-full flex flex-col'>
                    <div className='flex items-center justify-between pb-4'>
                      <div className='flex items-center gap-2'>
                        <Button size='icon' variant='ghost' onClick={handleCollapse} aria-label='收起'>
                          <IconArrowLeft className='h-4 w-4' />
                        </Button>
                        <div>
                          <h3 className='text-lg font-semibold leading-none'>{selectedJob.title}</h3>
                          <p className='text-xs text-muted-foreground'>
                            ￥{selectedJob.salaryRange[0]}-{selectedJob.salaryRange[1]} / 小时
                          </p>
                        </div>
                      </div>
                      <Button>立即申请</Button>
                    </div>
                    <div className='flex-1 overflow-auto pr-2 -mb-6'>
                      <div className='prose prose-sm dark:prose-invert max-w-none'>
                        <p>{selectedJob.description}</p>
                        {selectedJob.requirements?.length ? (
                          <>
                            <h4>基础要求</h4>
                            <ul>
                              {selectedJob.requirements.map((r) => (
                                <li key={r}>{r}</li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                        {selectedJob.details?.length ? (
                          <>
                            <h4>职位细节</h4>
                            <ul>
                              {selectedJob.details.map((d) => (
                                <li key={d}>{d}</li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </div>
                      <div className='mt-4 flex flex-wrap gap-2'>
                        <Badge variant='outline'>推荐奖励 ￥{selectedJob.referralBonus}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

// const topNav = [
//   {
//     title: '职位列表',
//     href: '/jobs',
//     isActive: true,
//     disabled: false,
//   },
// ]


