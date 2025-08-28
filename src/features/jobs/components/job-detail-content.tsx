import { forwardRef, useEffect, useRef, useState } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import type { Job } from '@/types/solutions'
import avatarsImg from '@/assets/images/avatars.png'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import JobTitleAndTags from './job-title-and-tags'
import PublisherSection from './publisher-section'

export interface JobDetailContentProps {
  job: Job
  inviteToken?: string
  onBack?: () => void
  recommendName?: string
  isTwoColumn?: boolean
}

const salaryTypeUnit: Record<Job['salaryType'], string> = {
  hour: '小时',
  month: '月',
  year: '年',
}

export default function JobDetailContent({
  job,
  inviteToken = '',
  onBack,
  recommendName,
  isTwoColumn = false,
}: JobDetailContentProps) {
  const isMobile = useIsMobile()

  const applicationCardRef = useRef<HTMLDivElement>(null)
  const [showFixedBar, setShowFixedBar] = useState(true)

  // 使用 IntersectionObserver 根据申请卡片是否可见切换底部栏
  useEffect(() => {
    if (!isMobile) {
      setShowFixedBar(false)
      return
    }

    const rootEl = document.querySelector(
      '[data-slot="sheet-content"]'
    ) as HTMLElement | null
    const target = applicationCardRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        // 当申请卡片进入可视区域一定比例时，隐藏固定栏
        setShowFixedBar(!entry.isIntersecting)
      },
      {
        root: rootEl ?? null,
        threshold: 0.2,
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [isMobile, job?.id])

  const applyJob = async () => {
    // 如果是本地环境，则直接跳转
    if (import.meta.env.DEV) {
      let url = `/interview/prepare?job_id=${job.id}`
      if (inviteToken) {
        url = `${url}&invite_token=${inviteToken}`
      }
      window.location.href = url
      return
    }

    const targetUrl = import.meta.env.VITE_INVITE_REDIRECT_URL
    if (targetUrl) {
      let url = `${targetUrl}?job_id=${job.id}`
      if (inviteToken) {
        url = `${url}&invite_token=${inviteToken}`
      }
      window.location.href = url
    }
  }

  interface ApplyCardProps {
    onApply: () => void
    className?: string
  }

  const ApplyCard = forwardRef<HTMLDivElement, ApplyCardProps>(
    ({ onApply, className }, ref) => {
      return (
        <div
          ref={ref}
          className={cn(
            'bg-primary/5 relative rounded-lg px-6 py-5 shadow-sm max-h-[303px]',
            className
          )}
        >
          <div className='text-foreground mb-3 text-[18px] font-bold'>
            准备好加入我们的专家群体了吗?
          </div>
          <div className='mb-[64px]'>
            <div className='mb-3 text-[16px]'>
              已有
              <span className='px-[5px] text-[18px] font-semibold text-[#4E02E4]'>
                5万+
              </span>
              专家进驻
            </div>
            <div className='flex flex-row-reverse items-center'>
              <div className='mr-3 flex -space-x-2'>
                <img src={avatarsImg} className='h-[37px] w-[187px]' />
              </div>
            </div>
          </div>
          <div className='mb-[12px] text-sm'>备好简历,开始申请吧！</div>
          <Button onClick={onApply} className='h-[44px] w-full'>
            立即申请
          </Button>
        </div>
      )
    }
  )

  return (
    <>
      <div className={cn(isTwoColumn && 'grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8')}>
        <div>
        {onBack && (
          <div className='flex pt-2 pb-2'>
            <button
              type='button'
              onClick={onBack}
              aria-label='返回'
              className='cursor-pointer'
            >
              <IconArrowLeft className='text-muted-foreground h-6 w-6' />
            </button>
          </div>
        )}

        {/* 顶部信息区（桌面在左列展示，这里仅用于小屏） */}
        <div className='flex flex-row items-start justify-between border-b border-gray-200 pt-5 pb-5'>
          {/* 左侧：标题和标签 */}
          <div className='min-w-0 flex-1'>
            <JobTitleAndTags job={job} />
            {/* 移动端：薪资信息显示在左侧标题下方 */}
            {isMobile && (
              <div>
                <div className='flex items-center gap-2'>
                  <div className='text-xl font-semibold text-gray-900'>
                    ¥{job.salaryRange[0]}~¥{job.salaryRange[1]}
                  </div>
                  <div className='text-xs text-gray-500'>{`每${salaryTypeUnit[job.salaryType]}`}</div>
                </div>
              </div>
            )}
          </div>
          {/* 右侧：薪资和按钮 - 桌面端显示 */}
          {!isMobile && (
            <div className='flex min-w-[140px] flex-col items-end'>
              <div className='mb-1 text-xl font-semibold text-gray-900'>
                ¥{job.salaryRange[0]}~¥{job.salaryRange[1]}
              </div>
              <div className='mb-3 text-xs text-gray-500'>{`每${
                salaryTypeUnit[job.salaryType]
              }`}</div>
              <Button
                onClick={applyJob}
                className='!rounded-md !bg-[#4E02E4] !px-6 !py-2 !text-base !text-white'
              >
                立即申请
              </Button>
            </div>
          )}
        </div>

        <PublisherSection recommendName={recommendName} />

        <div
          className='text-foreground/90 mb-8 text-base leading-relaxed'
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
        </div>
        {isTwoColumn && (
          <ApplyCard
            ref={applicationCardRef}
            onApply={applyJob}
            className='w-full md:w-[320px]'
          />
        )}
      </div>

      {/* 申请卡片放在正文下方 */}
      {!isTwoColumn && (
        <ApplyCard
          ref={applicationCardRef}
          onApply={applyJob}
          className='mx-auto my-6 w-full max-w-[320px]'
        />
      )}

      {/* 底部固定栏 - 仅在移动端显示，带过渡 */}
      {isMobile && (
        <div
          aria-hidden={!showFixedBar}
          className={
            'bg-background/95 supports-[backdrop-filter]:bg-background/75 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur transition-transform duration-300 ease-out will-change-transform ' +
            (showFixedBar ? 'translate-y-0' : 'translate-y-full')
          }
        >
          <div className='mx-auto w-full max-w-screen-sm px-4 py-3'>
            <div className='flex items-center justify-between'>
              <div className='mr-3 min-w-0 flex-1'>
                <div className='truncate text-sm font-semibold text-gray-900'>
                  {job.title}
                </div>
              </div>
              <Button
                onClick={applyJob}
                className='flex-shrink-0 !rounded-md !border-[#4E02E4] !bg-[#4E02E4] !px-4 !py-2 !text-sm !font-medium !text-white'
              >
                立即申请
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
