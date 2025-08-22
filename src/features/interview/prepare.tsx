import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { UploadArea } from '@/features/resume-upload/upload-area'
import { useNavigate } from '@tanstack/react-router'
import { useJobDetailQuery } from '@/features/jobs/api'
import { IconArrowLeft, IconBriefcase, IconWorldPin } from '@tabler/icons-react'
import { useState } from 'react'
import { SupportDialog } from '@/features/interview/components/support-dialog'

interface InterviewPreparePageProps {
  jobId?: string | number
}

export default function InterviewPreparePage({ jobId }: InterviewPreparePageProps) {
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)

  const { data: job, isLoading } = useJobDetailQuery(jobId ?? null, Boolean(jobId))

  return (
    <>
      <Main>

        {/* 主体两栏：左职位详情，右上传控件 */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
          {/* 左：职位信息 */}
          <div className='lg:col-span-7 space-y-6'>
            <div className='p-6'>
              {/* 顶部返回 */}
              <div className='flex pt-2 pb-2'>
                <button
                  type='button'
                  onClick={() => navigate({ to: '/jobs' })}
                  aria-label='返回'
                  className='cursor-pointer flex items-center gap-2 mb-4'
                >
                  <IconArrowLeft className='h-6 w-6 text-muted-foreground' />返回
                </button>
              </div>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <div className='text-2xl font-bold mb-2 leading-tight truncate'>{job?.title ?? (isLoading ? '加载中…' : '未找到职位')}</div>
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
                    {job ? `¥${job.salaryRange?.[0] ?? 0}~¥${job.salaryRange?.[1] ?? 0}` : '—'}
                  </div>
                  <div className='text-xs text-muted-foreground mb-3'>每小时</div>
                </div>
              </div>
              <Separator className='mt-2' />
              {/* 发布者信息 */}
              <div className='flex items-center gap-3 py-4 border-b border-border'>
                <div className='w-9 h-9 border-2 border-gray-200 rounded-full flex items-center justify-center overflow-hidden bg-white'>
                  <img src={'https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding.svg'} alt='meetchances' className='h-7 w-7 object-contain' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-foreground'>由一面千识发布</span>
                  <span className='text-xs mt-[10px] text-muted-foreground'>meetchances.com</span>
                </div>
              </div>
              <div className='text-foreground/90 leading-relaxed text-sm md:text-base py-4'>
                {job?.description ? (
                  <div dangerouslySetInnerHTML={{ __html: job.description }} />
                ) : (
                  <div className='text-muted-foreground'>{isLoading ? '正在加载职位详情…' : '暂无职位描述'}</div>
                )}
              </div>
            </div>
          </div>

          {/* 右：上传简历 */}
          <div className='lg:col-span-5'>
            <div className='p-6 sticky'>
              <div className='mb-4 text-right'>
                <Button variant='link' className='text-primary' onClick={() => setSupportOpen(true)}>寻求支持</Button>
              </div>
              <UploadArea className='my-4' onUploadComplete={(_results) => { /* 上传完成后保留页面即可 */ }} />
              <div className='my-4'>
                <Button disabled className='w-full' onClick={() => navigate({ to: '/interview/session', search: { job_id: jobId } })}>
                  确认简历，下一步
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 底部步骤与下一步 */}
        <div className='mt-8'>
          <div className='flex items-center gap-6'>
            <div className='flex-1'>

              <div className='h-2 w-full rounded-full bg-primary/20'>
                <div className='h-2 w-full rounded-full bg-primary' />
              </div>
              <div className='text-sm font-medium mb-2 text-center py-2'>简历分析</div>
            </div>
            <div className='flex-1'>
              <div className='h-2 w-full rounded-full bg-muted' />
              <div className='text-sm font-medium mb-2 text-muted-foreground text-center py-2'>AI 面试</div>
            </div>
          </div>
        </div>
      </Main>
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  )
}

