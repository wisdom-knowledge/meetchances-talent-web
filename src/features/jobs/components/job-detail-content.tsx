import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import avatarsImg from '@/assets/images/avatars.png'
import backImg from '@/assets/images/back.svg'
import cardVectorImg from '@/assets/images/card-vector.svg?url'
import leftImg from '@/assets/images/left.svg'
import logoImg from '@/assets/images/mobile-logo.svg'
import { userEvent } from '@/lib/apm'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { RichText } from '@/components/ui/rich-text'
import type { ApiJob } from '@/features/jobs/api'
import { salaryTypeUnitMapping } from '@/features/jobs/constants'
import JobTitleAndTags from './job-title-and-tags'
import PublisherSection from './publisher-section'

export interface JobDetailContentProps {
  job: ApiJob
  inviteToken?: string
  onBack?: () => void
  recommendName?: string
  isTwoColumn?: boolean
  backLabel?: string
  applyButtonText?: string
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
  const user = useAuthStore((s) => s.auth.user)

  const applicationCardRef = useRef<HTMLDivElement>(null)
  const [showFixedBar, setShowFixedBar] = useState(true)

  const isMock = useMemo(() => {
    return job.job_type === 'mock_job'
  }, [job])

  // 使用 IntersectionObserver 根据申请卡片是否可见切换底部栏
  useEffect(() => {
    if (!isMobile) {
      setShowFixedBar(false)
      return
    }

    // 如果是模拟面试，始终显示底部按钮
    if (isMock) {
      setShowFixedBar(true)
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
  }, [isMobile, isMock, job?.id])

  const applyJob = useCallback(async () => {
    userEvent('position_apply_clicked', '点击立即申请岗位', { job_id: job.id })
    let params = `data=job_id${job.id}`
    if (job.job_type === 'mock_job') {
      params = `${params}`
    }
    if (inviteToken) {
      params = `${params}andinvite_token${inviteToken}`
    }
    let targetUrl
    if (user) {
      targetUrl = `/interview/prepare`
    } else if (import.meta.env.DEV) {
      targetUrl = `/interview/prepare`
    } else {
      targetUrl = import.meta.env.VITE_INVITE_REDIRECT_URL
    }

    window.location.href = `${targetUrl}?${params}`
  }, [job.id, job.job_type, inviteToken, user])

  const low = job.salary_min ?? 0
  const high = job.salary_max ?? 0
  const unit = salaryTypeUnitMapping[job.salary_type as keyof typeof salaryTypeUnitMapping] ?? ''

  const mockJobTitle = useMemo(() => {
    return (
      <>
        <div className={cn('flex pt-5 pb-5', isMobile ? 'items-start pb-1 pt-4' : 'items-end justify-between')}>
          {/* 左侧：Logo + 文字内容 */}
          <div className='flex flex-col'>
            {/* Logo */}
            <div className='mb-4 flex h-8 w-[88px] items-center justify-center'>
              <img src={logoImg} alt='一面千识' className='h-8 w-auto' />
            </div>

            {/* 文字内容 */}
            <div className='flex flex-col gap-1'>
              <div className='text-[20px] leading-[1.5] font-semibold tracking-[0.02em] text-black font-sans'>
                欢迎来参加
              </div>
              <div className='text-[20px] leading-[1.5] font-semibold tracking-[0.02em] text-black font-sans'>
                <span className='text-[#4E02E4]'>{job.title}</span>模拟面试
              </div>
            </div>
          </div>

          {/* 右侧：开始面试按钮 - 仅桌面端显示 */}
          {!isMobile && (
            <Button
              onClick={applyJob}
              className='h-10 w-[122px] rounded-lg border-0 px-7 py-3 text-base leading-4 font-medium tracking-[0.025em] text-white shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] bg-gradient-to-r from-[#4E02E4] to-[#C994F7] font-sans'
            >
              开始面试
            </Button>
          )}
        </div>

        {/* 分割线 - 仅非移动端显示 */}
        {!isMobile && <div className='w-full border-t border-[#0000001A]' />}
      </>
    )
  }, [applyJob, job.title, isMobile])

  // 模拟面试底部按钮
  const mockInterviewBottomButton = useMemo(() => {
    return (
      <Button
        onClick={applyJob}
        className='h-[44px] w-full rounded-lg border-0 text-base font-medium text-white bg-gradient-to-r from-[#4E02E4] to-[#C994F7] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)]'
      >
        开始面试
      </Button>
    )
  }, [applyJob])

  // 普通职位底部内容
  const normalJobBottomContent = useMemo(() => {
    return (
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
    )
  }, [job.title, applyJob, applyButtonText])

  const jobTitle = useMemo(() => {
    return (
      <>
        {/* 顶部信息区（桌面在左列展示，这里仅用于小屏） */}
        <div className='flex flex-row items-start justify-between border-b border-gray-200 pt-5 pb-5'>
          {/* 左侧：标题和标签 */}
          <div className='min-w-0 flex-1'>
            <JobTitleAndTags job={job} />
            {/* 移动端：薪资信息显示在左侧标题下方 */}
            {isMobile && (
              <div>
                {low ? (
                  <div className='flex items-center gap-2'>
                    <div className='text-xl font-semibold text-gray-900'>
                      {high > 0 ? `¥${low}~¥${high}` : `¥${low}`}
                    </div>
                    <div className='text-xs text-gray-500'>{`每${unit}`}</div>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
            )}
          </div>
          {/* 右侧：薪资和按钮 - 桌面端显示 */}
          {!isMobile && (
            <div className='flex min-w-[140px] flex-col items-end'>
              {low ? (
                <>
                  <div className='mb-1 text-xl font-semibold text-gray-900'>
                    {high > 0 ? `¥${low}~¥${high}` : `¥${low}`}
                  </div>
                  <div className='mb-3 text-xs text-gray-500'>{`每${unit}`}</div>
                </>
              ) : (
                <div></div>
              )}
              <Button
                onClick={applyJob}
                className='!rounded-md !bg-[#4E02E4] !px-6 !py-2 !text-base !text-white'
              >
                {applyButtonText}
              </Button>
            </div>
          )}
        </div>
        <PublisherSection job={job} recommendName={recommendName} />
      </>
    )
  }, [applyButtonText, applyJob, high, isMobile, job, low, recommendName, unit])

  const mockJobBack = useMemo(() => {
    return (
      <div className='flex pt-2 pb-2'>
        <button
          type='button'
          onClick={onBack}
          aria-label={backLabel || '返回'}
          className='cursor-pointer'
        >
          <img
            src={leftImg}
            alt='back'
            className='text-muted-foreground h-6 w-6'
          />
        </button>
        {backLabel ? (
          <span
            onClick={onBack}
            className='ml-[12px] cursor-pointer self-center text-[16px]'
          >
            {backLabel}
          </span>
        ) : null}
      </div>
    )
  }, [backLabel, onBack])

  const jobBack = useMemo(() => {
    return (
      <div className='flex pt-2 pb-2'>
        <button
          type='button'
          onClick={onBack}
          aria-label={backLabel || '返回'}
          className='cursor-pointer'
        >
          <img
            src={backImg}
            alt='back'
            className='text-muted-foreground h-6 w-6'
          />
        </button>
        {backLabel ? (
          <span
            onClick={onBack}
            className='text-muted-foreground ml-2 cursor-pointer self-center text-sm'
          >
            {backLabel}
          </span>
        ) : null}
      </div>
    )
  }, [backLabel, onBack])

  return (
    <div className={cn(isMobile ? (isMock ? 'mx-[8px] mb-[16px]' : 'mx-[8px] my-[16px]') : 'm-[16px]')}>
      <div
        className={cn(
          isTwoColumn && 'grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]'
        )}
      >
        <div className='max-h-[calc(100vh-80px)] flex flex-col'>
          {onBack && (isMock ? mockJobBack : jobBack)}

          {isMock ? mockJobTitle : jobTitle}

          <RichText
            content={job.description || '暂无描述'}
            className={cn('mt-5 min-h-[100px] overflow-auto', isMobile && isMock ? '' : 'mb-8')}
          />
        </div>
        {isTwoColumn && !isMock && (
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
                  <img
                    src={avatarsImg}
                    alt=''
                    aria-hidden='true'
                    className='h-[37px] w-[187px]'
                  />
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
      {!isTwoColumn && !isMock && (
        <div
          ref={applicationCardRef}
          className={cn(
            'bg-primary/5 relative rounded-lg px-6 py-5 shadow-sm',
            'mx-auto my-6 w-full'
          )}
          style={{
            backgroundImage: !isMobile ? `url("${cardVectorImg}")` : undefined,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 17px bottom -31px',
            backgroundSize: '283px 314px',
          }}
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
            <div
              className={cn(
                'flex items-center',
                isMobile ? 'flex-row-reverse' : ''
              )}
            >
              <div className='flex -space-x-2'>
                <img
                  src={avatarsImg}
                  alt=''
                  aria-hidden='true'
                  className='h-[37px] w-[187px]'
                />
              </div>
            </div>
          </div>
          <div className='mb-[12px] text-sm'>备好简历,开始申请吧！</div>
          <Button
            onClick={applyJob}
            className={cn('h-[44px] w-full', isMobile ? '' : 'max-w-[272px]')}
          >
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
            {isMock ? mockInterviewBottomButton : normalJobBottomContent}
          </div>
        </div>
      )}
    </div>
  )
}
