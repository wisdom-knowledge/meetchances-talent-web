import { useEffect, useRef, useState } from 'react'
import type { ApiJob } from '@/features/jobs/api'
import backImg from '@/assets/images/back.svg'
import avatarsImg from '@/assets/images/avatars.png'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { RichText } from '@/components/ui/rich-text'
import JobTitleAndTags from './job-title-and-tags'
import PublisherSection from './publisher-section'
import { userEvent } from '@/lib/apm'

export interface JobDetailContentProps {
  job: ApiJob
  inviteToken?: string
  onBack?: () => void
  recommendName?: string
  isTwoColumn?: boolean
  backLabel?: string
  applyButtonText?: string
}

const salaryTypeUnit: Record<NonNullable<ApiJob['salary_type']>, string> = {
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
  backLabel,
  applyButtonText = '立即申请',
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
    if (!target) {
      setShowFixedBar(true)
      return
    }

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
    userEvent('position_apply_clicked', '点击立即申请岗位', { job_id: job.id })
    let params = `data=job_id${job.id}`
    if (job.job_type === 'mock_job') {
      params = `${params}`
    }
    if (inviteToken) {
      params = `${params}andinvite_token${inviteToken}`
    }
    let targetUrl
    if (import.meta.env.DEV) {
      targetUrl = `/interview/prepare`
    } else {
      targetUrl = import.meta.env.VITE_INVITE_REDIRECT_URL
    }

    window.location.href = `${targetUrl}?${params}`
  }

  const low = job.salary_min ?? 0
  const high = job.salary_max ?? 0
  const unit = salaryTypeUnit[job.salary_type as keyof typeof salaryTypeUnit] ?? '小时'

  return (
    <div className={cn(isMobile ? 'my-[16px] mx-[8px]' : 'm-[16px]' )}>
      <div
        className={cn(
          isTwoColumn && 'grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]'
        )}
      >
        <div>
          {onBack && (
            <div className='flex pt-2 pb-2'>
              <button
                type='button'
                onClick={onBack}
                aria-label={backLabel || '返回'}
                className='cursor-pointer'
              >
                <img src={backImg} alt="back" className='text-muted-foreground h-6 w-6' />
              </button>
              {backLabel ? (
                <span onClick={onBack} className='cursor-pointer ml-2 self-center text-sm text-muted-foreground'>{backLabel}</span>
              ) : null}
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
                  {
                    low && high ? (
                      <div className='flex items-center gap-2'>
                        <div className='text-xl font-semibold text-gray-900'>
                          ¥{low}~¥{high}
                        </div>
                        <div className='text-xs text-gray-500'>{`每${unit}`}</div>
                      </div>)
                     : <div></div>}
                </div>
              )}
            </div>
            {/* 右侧：薪资和按钮 - 桌面端显示 */}
            {!isMobile && (
              <div className='flex min-w-[140px] flex-col items-end'>
                {low && high ?  (
                  <>
                    <div className='mb-1 text-xl font-semibold text-gray-900'>
                      ¥{low}~¥{high}
                    </div>
                    <div className='mb-3 text-xs text-gray-500'>{`每${unit}`}</div>
                  </>
                ) : <div></div>}
                <Button
                  onClick={applyJob}
                  className='!rounded-md !bg-[#4E02E4] !px-6 !py-2 !text-base !text-white'
                >
                  {applyButtonText}
                </Button>
              </div>
            )}
          </div>

          <PublisherSection recommendName={recommendName} />

          <RichText
            content={job.description || '暂无描述'}
            className='min-h-[100px] mt-5 mb-8'
          />
        </div>
        {isTwoColumn && (
          <div
            ref={applicationCardRef}
            className={cn(
              'bg-primary/5 relative max-h-[303px] rounded-lg px-6 py-5 shadow-sm',
              'w-full md:w-[320px]'
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
                  <img src={avatarsImg} alt='' aria-hidden='true' className='h-[37px] w-[187px]' />
                </div>
              </div>
            </div>
            <div className='mb-[12px] text-sm'>备好简历,开始申请吧！</div>
            <Button onClick={applyJob} className='h-[44px] w-full'>
              {applyButtonText}
            </Button>
          </div>
        )}
      </div>

      {/* 申请卡片放在正文下方 */}
      {!isTwoColumn && (
        <div
          ref={applicationCardRef}
          className={cn(
            'bg-primary/5 relative rounded-lg px-6 py-5 shadow-sm',
            'mx-auto my-6 w-full'
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
            <div className={cn('flex items-center', isMobile ? 'flex-row-reverse' : '')}>
              <div className='flex -space-x-2'>
                <img src={avatarsImg} alt='' aria-hidden='true' className='h-[37px] w-[187px]' />
              </div>
            </div>
          </div>
          <div className='mb-[12px] text-sm'>备好简历,开始申请吧！</div>
          <Button onClick={applyJob} className={cn('h-[44px] w-full', isMobile ? '' : 'max-w-[272px]')}>
            {applyButtonText}
          </Button>
        </div>
      )}

      {/* 底部固定栏 - 仅在移动端显示，带过渡 */}
      {isMobile && (
        <div
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
                {applyButtonText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
