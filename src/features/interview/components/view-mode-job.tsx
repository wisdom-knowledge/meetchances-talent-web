import { useRef, useEffect, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { RichText } from '@/components/ui/rich-text'
import { Button } from '@/components/ui/button'
import { UploadArea } from '@/features/resume-upload/upload-area'
import { MobileUploadArea } from '@/features/resume-upload/mobile-upload-area'
import { IconBriefcase, IconWorldPin, IconUpload, IconEdit } from '@tabler/icons-react'
import { uploadTalentResume } from '@/features/resume-upload/utils/api'
import { useIsMobile } from '@/hooks/use-mobile'
import type { ResumeFormValues } from '@/features/resume/data/schema'
import type { ApiJob } from '@/features/jobs/api'
import PublisherSection from '@/features/jobs/components/publisher-section'
import { salaryTypeMapping, salaryTypeUnitMapping } from '@/features/jobs/constants'

interface ViewModeJobProps {
  job?: ApiJob
  isLoading: boolean
  isMock: boolean
  resumeValues: ResumeFormValues | null
  uploadingResume: boolean
  onDrawerOpen: () => void
  onResumeOpen: () => void
  onUploadingChange: (uploading: boolean) => void
  onUploadComplete: (results: Array<{ success: boolean; backend?: { struct_info?: unknown } }>) => void
  onConfirmResumeClick: () => void
  onUploadEvent: (action: string) => void
}

// PC 端组件
function DesktopViewModeJob({
  job,
  isLoading,
  isMock,
  resumeValues,
  uploadingResume,
  onDrawerOpen,
  onResumeOpen,
  onUploadingChange,
  onUploadComplete,
  onConfirmResumeClick,
  onUploadEvent,
}: ViewModeJobProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [showGradient, setShowGradient] = useState(false)
  const [showMoreButton, setShowMoreButton] = useState(false)

  // 检测内容是否超出容器高度
  const checkContentOverflow = () => {
    if (!contentRef.current) return
    
    const container = contentRef.current
    const isOverflowing = container.scrollHeight > container.clientHeight
    setShowGradient(isOverflowing)
    setShowMoreButton(isOverflowing)
  }

  // 滚动事件处理
  const handleScroll = () => {
    if (!contentRef.current) return
    
    const container = contentRef.current
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1
    setShowGradient(!isAtBottom)
  }

  // 监听内容变化和窗口大小变化
  useEffect(() => {
    checkContentOverflow()
    
    const handleResize = () => {
      setTimeout(checkContentOverflow, 100) // 延迟检查，确保布局完成
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [job?.description]) // 当职位描述变化时重新检查

  return (
    <div className='flex flex-1 flex-row items-center w-full gap-4 lg:gap-6 max-w-screen-xl mx-auto overflow-hidden min-h-0 px-2 md:px-4'>
      {/* 左：职位信息 - 占60%比例 */}
      <div className='flex-[6] min-w-[400px] flex flex-col max-h-[650px] h-[650px]'>
        <div className='flex h-full flex-col min-h-0'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='text-2xl font-semibold leading-[1.5] tracking-[0.48px]'>
                {job?.title ?? (isLoading ? '加载中…' : '未找到职位')}
              </div>
            </div>
            {/* 薪资显示移到了标题下方 */}
          </div>
          {!isMock && (
            <div className='flex flex-col gap-2'>
              <div className='text-sm font-semibold'>
                {job ? (job.salary_max && job.salary_max > 0 
                  ? `¥${job.salary_min ?? 0}~¥${job.salary_max}/小时` 
                  : `¥${job.salary_min ?? 0}/小时`) : '—'}
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-1 text-primary'>
                  <IconBriefcase className='h-5 w-5' />
                  <span className='text-sm'>{job ? `${salaryTypeMapping[job.salary_type as keyof typeof salaryTypeMapping] || '时'}薪制` : '时薪制'}</span>
                </div>
                <div className='flex items-center gap-1 text-primary'>
                  <IconWorldPin className='h-5 w-5' />
                  <span className='text-sm'>远程</span>
                </div>
              </div>
            </div>
          )}
          <Separator className='mt-2 mb-4' />
          {/* 发布者信息 */}
          {job && <PublisherSection job={job} />}
          {/* 职位描述区域 */}
          <div className='flex-1 min-h-0 text-foreground/90 leading-relaxed text-sm md:text-base flex flex-col overflow-hidden'>
            {/* 滚动区域 + 渐隐遮罩 */}
            <div className='relative flex-1 min-h-0 overflow-hidden'>
              <div 
                ref={contentRef}
                className='h-full overflow-y-auto pr-2 py-4'
                onScroll={handleScroll}
              >
                {job?.description ? (
                  <RichText content={job.description} />
                ) : (
                  <div className='text-muted-foreground'>
                    {isLoading ? '正在加载职位详情…' : '暂无职位描述'}
                  </div>
                )}
              </div>
              {/* 渐隐遮罩 - 只在内容超出时显示 */}
              {showGradient && (
                <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent' />
              )}
            </div>
            {/* 查看更多按钮 - 只在内容超出时显示 */}
            {showMoreButton && (
              <div className='pt-2 pb-2 text-center shrink-0'>
                <Button variant='outline' size='sm' onClick={onDrawerOpen}>
                  查看更多
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右：上传简历 - 占40%比例 */}
      <div className='flex-[4] min-w-[320px] max-w-[500px] flex flex-col max-h-[650px] h-[650px] justify-center'>
        <div className='relative my-8 w-full'>
          <UploadArea
            className='my-4'
            uploader={uploadTalentResume}
            onUploadingChange={onUploadingChange}
            onUploadComplete={onUploadComplete}
          >
            {resumeValues && !uploadingResume && (
              <div className='mb-4 flex items-center justify-between rounded-md border p-3'>
                <div className='text-sm text-left'>
                  <div className='font-medium'>姓名：{resumeValues.name || '—'}</div>
                  <div className='text-muted-foreground mt-1'>电话：{resumeValues.phone || '—'}</div>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={(e) => {
                    e.stopPropagation()
                    onResumeOpen()
                  }}
                >
                  点击查看
                </Button>
              </div>
            )}

            {resumeValues ? (
              <Button size='sm' variant='secondary' onClick={() => onUploadEvent('update')}>
                <IconUpload className='h-4 w-4' />
                更新简历
              </Button>
            ) : (
              <Button size='sm' variant='secondary' onClick={() => onUploadEvent('upload')}>
                <IconUpload className='h-4 w-4' />
                上传简历
              </Button>
            )}
          </UploadArea>

          <div className='my-4'>
            <Button
              className={
                !(uploadingResume || !resumeValues)
                  ? 'w-full bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)]'
                  : 'w-full bg-[#C9C9C9] text-white'
              }
              disabled={uploadingResume || !resumeValues}
              onClick={onConfirmResumeClick}
            >
              {uploadingResume ? '正在分析简历…' : '确认简历，下一步'}
            </Button>
            {isMock && !resumeValues && (
              <div className='mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                <span>没有简历？</span>
                <button
                  type='button'
                  onClick={onResumeOpen}
                  className='inline-flex items-center gap-1 text-primary hover:underline underline-offset-2'
                >
                  <IconEdit className='h-3.5 w-3.5' /> 手动填写
                </button>
                <span className='text-primary'>»</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 移动端组件
function MobileViewModeJob({
  job,
  isLoading,
  isMock,
  resumeValues,
  uploadingResume,
  onDrawerOpen: _onDrawerOpen,
  onResumeOpen,
  onUploadingChange,
  onUploadComplete,
  onConfirmResumeClick,
  onUploadEvent,
}: ViewModeJobProps) {
  return (
    <div className='flex flex-col w-full h-screen max-h-screen overflow-hidden'>
      {/* 顶部信息区域 - 不可滚动 */}
      <div className='flex-shrink-0 py-6 space-y-4'>
        {/* 标题和薪资 */}
        <div className='flex space-y-2'>
          <h1 className='text-xl flex-1 font-semibold leading-tight text-foreground pr-2 line-clamp-2'>
            {job?.title ?? (isLoading ? '加载中…' : '未找到职位')}
          </h1>
          {!isMock && (
            <div className='flex flex-col items-end min-w-fit'>
              <div className='text-sm font-semibold text-foreground whitespace-nowrap'>
                {job ? (job.salary_max && job.salary_max > 0 
                  ? `¥${job.salary_min ?? 0}~¥${job.salary_max}` 
                  : `¥${job.salary_min ?? 0}`) : '—'}
              </div>
              <div className='text-xs font-semibold '>/{job ? salaryTypeUnitMapping[job.salary_type as keyof typeof salaryTypeUnitMapping] || '小时' : '小时'}</div>
            </div>
          )}
        </div>

        {/* 工作类型标签 */}
        {!isMock && (
          <div className='flex items-center gap-3 text-sm text-primary'>
            <div className='flex text-xs items-center gap-1'>
              <IconBriefcase className='h-4 w-4' />
              <span>{job ? `${salaryTypeMapping[job.salary_type as keyof typeof salaryTypeMapping] || '时'}薪制` : '时薪制'}</span>
            </div>
            <div className='flex text-xs items-center gap-1'>
              <IconWorldPin className='h-4 w-4' />
              <span>远程</span>
            </div>
          </div>
        )}

        
      </div>

      {/* 职位描述区域 - 可滚动，占据剩余空间 */}
      <div className='flex-1 min-h-0 overflow-auto'>
        {/* 发布者信息 */}
        {job && <PublisherSection job={job} className='border-t' />}
        <div className='text-sm text-foreground/80 leading-relaxed py-2'>
          {job?.description ? (
            <RichText content={job.description} />
          ) : (
            <div className='text-muted-foreground'>
              {isLoading ? '正在加载职位详情…' : '暂无职位描述'}
            </div>
          )}
        </div>
      </div>

      {/* 底部固定区域 - 上传简历和按钮 */}
      <div className='flex-shrink-0 border-border bg-background'>
        <div className='py-6 space-y-4'>
          <MobileUploadArea
            resumeValues={resumeValues}
            uploadingResume={uploadingResume}
            onResumeOpen={onResumeOpen}
            onUploadingChange={onUploadingChange}
            onUploadComplete={onUploadComplete}
            onUploadEvent={onUploadEvent}
          />

          {/* 底部按钮 */}
          <Button
            className={
              !(uploadingResume || !resumeValues)
                ? 'w-full bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)]'
                : 'w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }
            disabled={uploadingResume || !resumeValues}
            onClick={onConfirmResumeClick}
          >
            {uploadingResume ? '正在分析简历…' : '确认简历，下一步'}
          </Button>

          {/* 手动填写选项 */}
          {isMock && !resumeValues && (
            <div className='text-center'>
              <button
                type='button'
                onClick={onResumeOpen}
                className='inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2'
              >
                <IconEdit className='h-4 w-4' />
                没有简历？手动填写
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ViewModeJob(props: ViewModeJobProps) {
  const isMobile = useIsMobile()

  return isMobile ? <MobileViewModeJob {...props} /> : <DesktopViewModeJob {...props} />
}

