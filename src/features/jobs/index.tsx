import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
// import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
// import { Search } from '@/components/search'
import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { ExploreJobs } from './mockData.ts'
import { useJobsQuery, useJobDetailQuery } from './api'
import { JobType } from '@/constants/explore'
import type { Job } from '@/types/solutions'
import { cn } from '@/lib/utils'
import { IconArrowLeft, IconUserPlus, IconBriefcase, IconWorldPin } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'

export default function JobsListPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [isDetailMounted, setIsDetailMounted] = useState(false)

  const { data: jobsData, isLoading } = useJobsQuery({ skip: 0, limit: 20 })
  const jobs = jobsData?.data ?? []

  // 当只拿到列表的精简数据时，点击后再拉详情
  const { data: detailData } = useJobDetailQuery(selectedJob?.id ?? null, isDetailMounted)
  const selectedJobData = detailData ?? selectedJob

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
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>职位列表</h1>
          <p className='text-muted-foreground'>寻找与你匹配的远程/合约职位</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='relative flex h-[calc(100vh-4rem)] flex-col gap-6 lg:flex-row -mb-8'>
          {/* 左侧：职位列表 */}
          <div className={cn('h-full lg:h-auto flex-1')}>
            <ScrollArea className='h-full pr-1'>
              <ul className='space-y-2'>
                {(isLoading ? [] : jobs).map((job: Job, index: number) => {
                   const isActive = selectedJob?.id === job.id
                  const openingsCount = (index % 6) + 1
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
                            <Badge variant='emphasis'>
                              <IconUserPlus className='h-3.5 w-3.5' />
                               {openingsCount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 })}
                            </Badge>
                            <Badge variant='outline'>
                              ￥{job.salaryRange?.[0] ?? 0} - ￥{job.salaryRange?.[1] ?? 0} / 小时
                            </Badge>
                            <Badge variant='emphasis'>
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
                  'absolute left-0 right-0 -top-16 bottom-0 z-50 -mt-6 mx-auto px-4 md:px-5 bg-white flex flex-col overflow-hidden transition-transform duration-300 border-l ' +
                  (isDetailVisible ? 'translate-x-0' : 'translate-x-full pointer-events-none')
                }
              >
                {selectedJobData && (
                  <>
                    {/* 顶部返回 */}
                    <div className='flex pt-4 pb-4'>
                      <button
                        type='button'
                        onClick={handleCollapse}
                        aria-label='返回'
                        className='cursor-pointer'
                      >
                        <IconArrowLeft className='h-6 w-6 text-muted-foreground' />
                      </button>
                    </div>

                    {/* 可滚动内容 */}
                    <div className='flex-1 overflow-y-auto'>
                      {/* 标题与薪资区 */}
                      <div className='flex pt-5 pb-5 items-start justify-between border-b border-border'>
                        <div className='flex-1 min-w-0'>
                          <div className='text-2xl font-bold mb-2 leading-tight truncate text-foreground'>
                            {selectedJobData.title}
                          </div>
                          <div className='flex items-center gap-4 text-primary mb-2'>
                            <div className='flex items-center'>
                              <IconBriefcase className='h-4 w-4 mr-1' />
                              <span className='text-[14px]'>时薪制</span>
                            </div>
                            <div className='flex items-center'>
                              <IconWorldPin className='h-4 w-4 mr-1' />
                              <span className='text-[14px]'>远程</span>
                            </div>
                          </div>
                        </div>
                        <div className='hidden md:flex flex-col items-end min-w-[140px]'>
                          <div className='text-xl font-semibold text-foreground mb-1'>
                            ¥{selectedJobData.salaryRange?.[0] ?? 0}~¥{selectedJobData.salaryRange?.[1] ?? 0}
                          </div>
                          <div className='text-xs text-muted-foreground mb-3'>每小时</div>
                          <Button disabled className='px-6 py-2 text-base'>岗位将于8月30日开放</Button>
                        </div>
                      </div>

                      {/* 发布者信息 */}
                      <div className='flex items-center gap-3 py-4 border-b border-border'>
                        <div className='w-9 h-9 border-2 border-gray-200 rounded-full flex items-center justify-center'>
                          <span className='text-sm font-bold'>MC</span>
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium text-foreground'>由一面千识发布</span>
                          <span className='text-xs mt-[10px] text-muted-foreground'>meetchances.com</span>
                        </div>
                      </div>

                      {/* 详情描述（富文本 HTML 片段） */}
                      <div className='py-8'>
                        <div
                          className='text-foreground/90 text-base leading-relaxed mb-8'
                          dangerouslySetInnerHTML={{ __html: selectedJobData.description }}
                        />

                        <div className='mt-6 md:hidden relative mx-auto w-full max-w-[320px] bg-primary/5 rounded-lg shadow-sm px-6 py-5'>
                          <div className='text-[18px] font-bold text-foreground mb-3'>准备好加入我们的专家群体了吗?</div>
                          <div className='text-sm mb-[12px]'>备好简历,开始申请吧！</div>
                          <Button disabled className='h-[44px] w-full'>岗位将于8月30日开放</Button>
                        </div>
                      </div>
                    </div>
                  </>
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


