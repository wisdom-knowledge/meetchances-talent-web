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
  return (
    <div className='flex-1 flex flex-row items-stretch w-full justify-between max-w-screen-xl mx-auto overflow-hidden min-h-0'>
      {/* 左：职位信息 */}
      <div className='col-span-7 space-y-6 pl-3 flex flex-col h-full min-h-0 max-h-[600px] overflow-y-auto my-auto w-full'>
        <div className='flex h-full flex-col min-h-0'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='text-2xl font-bold mb-2 leading-tight truncate'>
                {job?.title ?? (isLoading ? '加载中…' : '未找到职位')}
              </div>
              {!isMock && (
                <div className='text-primary mb-2 flex items-center gap-4'>
                  <div className='flex items-center'>
                    <IconBriefcase className='mr-1 h-4 w-4' />
                    <span className='text-[14px]'>时薪制</span>
                  </div>
                  <div className='flex items-center'>
                    <IconWorldPin className='mr-1 h-4 w-4' />
                    <span className='text-[14px]'>远程</span>
                  </div>
                </div>
              )}
            </div>
            {!isMock && (
              <div className='hidden md:flex flex-col items-end min-w-[140px]'>
                <div className='text-xl font-semibold text-foreground mb-1'>
                  {job ? `¥${job.salary_min ?? 0}~¥${job.salary_max ?? 0}` : '—'}
                </div>
                <div className='text-xs text-muted-foreground mb-3'>每小时</div>
              </div>
            )}
          </div>
          <Separator className='mt-2' />
          {/* 发布者信息 */}
          {job && <PublisherSection job={job} />}
          <div className='flex-1 min-h-0 text-foreground/90 leading-relaxed text-sm md:text-base py-4 flex flex-col'>
            {/* 限高 + 渐隐遮罩 */}
            <div className='relative flex-1 min-h-0 overflow-hidden'>
              <div className='h-full overflow-hidden'>
                {job?.description ? (
                  <RichText content={job.description} />
                ) : (
                  <div className='text-muted-foreground'>
                    {isLoading ? '正在加载职位详情…' : '暂无职位描述'}
                  </div>
                )}
              </div>
              {/* 渐隐遮罩 */}
              <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent' />
            </div>
            <div className='mt-4 text-center'>
              <Button variant='outline' onClick={onDrawerOpen}>
                查看更多
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 右：上传简历 */}
      <div className='col-span-5 flex flex-col h-full min-h-0 justify-center'>
        <div className='p-4 relative my-8 pl-[36px]'>
          <UploadArea
            className='my-4 min-w-[420px]'
            uploader={uploadTalentResume}
            onUploadingChange={onUploadingChange}
            onUploadComplete={onUploadComplete}
          >
            {resumeValues && !uploadingResume && (
              <div className='mb-4 flex items-center justify-between rounded-md border p-3 min-w-[400px]'>
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
              className='w-full'
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
            <div className='text-sm font-semibold text-foreground'>
              {job ? `¥${job.salary_min ?? 0}/小时` : '—'}
            </div>
          )}
        </div>

        {/* 工作类型标签 */}
        {!isMock && (
          <div className='flex items-center gap-3 text-sm text-primary'>
            <div className='flex text-xs items-center gap-1'>
              <IconBriefcase className='h-4 w-4' />
              <span>时薪制</span>
            </div>
            <div className='flex text-xs items-center gap-1'>
              <IconWorldPin className='h-4 w-4' />
              <span>远程</span>
            </div>
          </div>
        )}

        
      </div>

      {/* 职位描述区域 - 可滚动，占据剩余空间 */}
      <div className='flex-1 min-h-0 overflow-auto relative'>
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
        
        {/* 底部渐隐遮罩 - 引导用户滚动 */}
        <div className='pointer-events-none sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent' />
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
            className='w-full'
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

