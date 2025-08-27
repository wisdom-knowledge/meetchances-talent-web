import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useRouterStore } from '@/stores/routerStore'
import { handleServerError } from '@/utils/handle-server-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import SupportDialog from '@/components/support-dialog'
import { fetchForHelp } from '../home/api'
import { FeedbackParams, fetchFeedback } from './api'

type StepKey = 1 | 2

export default function FinishPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<StepKey>(1)
  const [helpOpen, setHelpOpen] = useState(false)

  // Step 1: 面试体验
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const interviewId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('interview_id') ?? ''
  }, [])

  const previousPath = useRouterStore((s) => s.previousPath)
  const finishSubmit = useMemo(() => {
    // if (!previousPath) return true
    // try {
    //   const url = new URL(previousPath)
    //   return url.pathname !== '/invited'
    // } catch {
    //   return previousPath !== '/invited'
    // }
    return false
  }, [previousPath])

  const handleSubmit = async (params: FeedbackParams) => {
    if (rating <= 0 || submitting) return
    setSubmitting(true)
    try {
      await fetchFeedback(params)
      setStep(2)
    } catch (error) {
      handleServerError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSupportSubmit = async (_payload: {
    message: string
    contactMethod: 'phone' | 'none'
    phone?: string
  }) => {
    fetchForHelp({
      detail: _payload.message,
      need_contact: _payload.contactMethod === 'phone',
      phone_number: _payload.phone ?? '',
    })
  }

  const goNext = () => {
    if (step === 1 && interviewId) {
      handleSubmit({
        interview_id: Number(interviewId),
        score: rating,
        feedback: feedback,
      })
      return
    }
    if (step === 2) {
      navigate({ to: '/resume' })
      return
    }
  }

  const handleHelp = () => {
    setHelpOpen(true)
  }

  if (finishSubmit) {
    return (
      <Main
        fixed
        className={`flex w-full items-center justify-center bg-white`}
      >
        <img
          src={
            'https://dnu-cdn.xpertiise.com/common/8af6d9a9-6f39-47e2-ac48-74abe3c833e6.svg'
          }
          alt='meetchances'
          className='mb-[32px] ml-3 h-[120px] w-[140px] object-contain'
        />
        <h2 className='mb-3 text-xl font-semibold'>复核面试中</h2>
        <p className='mb-6 max-w-[428px] text-center text-sm opacity-70'>
          感谢您完成面试，我们正在复核您的面试过程，预计48小时内通知您，请等待短信通知
        </p>
      </Main>
    )
  }

  return (
    <Main
      fixed
      className={`flex w-full items-center justify-center bg-[#ECD9FC]`}
    >
      {step === 1 && (
        <section className='min-w-[418px] space-y-6'>
          <Card>
            <CardContent className='p-6'>
              <h2 className='mb-3 text-center text-[24px] font-semibold tracking-wide'>
                您的面试体验如何？
              </h2>
              <div className='mb-6 flex items-center justify-center gap-[10px]'>
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1
                  const filled = (hoverRating || rating) >= value
                  return (
                    <button
                      key={value}
                      type='button'
                      aria-label={`评分 ${value}`}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      className='transition-transform hover:scale-105'
                    >
                      {filled ? (
                        <IconStarFilled className='h-10 w-10 text-[#4E02E4]' />
                      ) : (
                        <IconStar className='h-10 w-10 text-[#4E02E4]' />
                      )}
                    </button>
                  )
                })}
              </div>

              {rating > 0 && (
                <div className='space-y-2'>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder='请填写您的反馈（可选）'
                    className='min-h-[151px] min-w-[458px]'
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className='flex items-center justify-center'>
            <Button
              onClick={goNext}
              disabled={rating <= 0 || submitting}
              className='h-[44px] w-[200px] bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)] text-white'
            >
              提交
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className='flex flex-col items-center justify-center space-y-6'>
          <img
            src={
              'https://dnu-cdn.xpertiise.com/common/f26c34ef-b3e5-418d-a7b2-70e294f7ccdc.svg'
            }
            alt='meetchances'
            className='h-[120px] w-[140px] object-contain'
          />
          <h2 className='mb-3 text-xl font-semibold'>提升您的录取机会</h2>
          <p className='mb-6 max-w-[428px] text-center text-sm opacity-70'>
            感谢您完成面试，我们正在复核您的面试过程，预计48小时内通知您，请等待短信通知
          </p>
          <p className='mb-6 max-w-[428px] text-center text-sm opacity-70'>
            如您尚未提交岗位要求的学历和经验认证材料，请点击下方按钮进行提交，以免影响您的录取
          </p>

          <div className='flex items-center justify-center gap-3'>
            <Button
              onClick={goNext}
              className='mr-0 ml-0 h-[44px] w-[200px] rounded-md border border-white/10 bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)] px-7 py-3 text-base text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50'
            >
              提交材料
            </Button>
          </div>
        </section>
      )}
      <div className='absolute right-0 bottom-3 left-0 text-center text-sm text-black/70'>
        需要支持请
        <span
          className='cursor-pointer text-[var(--color-blue-600)] underline'
          onClick={handleHelp}
        >
          寻求帮助
        </span>
      </div>

      {/* 寻求支持弹窗 */}
      <SupportDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        onSubmit={handleSupportSubmit}
      />
    </Main>
  )
}
