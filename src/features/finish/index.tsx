import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { handleServerError } from '@/utils/handle-server-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import SupportDialog from '@/components/support-dialog'
import { fetchForHelp } from '../home/api'
import { FeedbackParams, fetchFeedback } from './api'
import { toast } from 'sonner'
import emptyStar from '@/assets/images/empty-start.svg'
import filledStar from '@/assets/images/full-start.svg'
import { NodeActionTrigger, postNodeAction } from '@/features/interview/api'
import { reportFinishFeedbackLowScore } from '@/lib/apm'
import { useJobDetailQuery } from '@/features/jobs/api'


export default function FinishPage() {
  const navigate = useNavigate()

  const [helpOpen, setHelpOpen] = useState(false)

  // Step 1: 面试体验
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  // 细分评分（仅当总评分 <= 4 时展示与收集）
  const [flowScore, setFlowScore] = useState<number>(0)
  const [flowHover, setFlowHover] = useState<number>(0)
  const [expressionScore, setExpressionScore] = useState<number>(0)
  const [expressionHover, setExpressionHover] = useState<number>(0)
  const [relevanceScore, setRelevanceScore] = useState<number>(0)
  const [relevanceHover, setRelevanceHover] = useState<number>(0)

  const interviewId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('interview_id') ?? ''
  }, [])

  // 获取 jobId
  const jobId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('job_id')
    if (!id) return null
    const n = Number(id)
    return Number.isNaN(n) ? id : n
  }, [])

  // 获取职位信息并判断是否为模拟面试
  const { data: job } = useJobDetailQuery(jobId, Boolean(jobId))
  const isMock = useMemo(() => job?.job_type === 'mock_job', [job])


  // 是否为主动取消面试：仅接受 'true' / 'false' 或无该参数
  const isCanceled = useMemo(() => {
    const sp = new URLSearchParams(window.location.search)
    const val = sp.get('is_canceled') ?? sp.get('isCanceled')
    return val === 'true'
  }, [])

  // interview 节点 id（用于补偿上报 NodeAction）
  const interviewNodeId = useMemo(() => {
    const sp = new URLSearchParams(window.location.search)
    const nodeId = sp.get('interview_node_id')
    if (!nodeId) return undefined
    const n = Number(nodeId)
    return Number.isNaN(n) ? (nodeId as string) : (n as number)
  }, [])

  // 进入页面即进行一次补偿上报（submit），失败不阻塞流程
  useEffect(() => {
    ;(async () => {
      try {
        if (interviewNodeId != null && !isMock && job != null) {
          await postNodeAction({ node_id: interviewNodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
        }
      } catch (_e) {
        // ignore
      }
    })()
  }, [interviewNodeId, isMock, job])

  // 把 prepare 页面的参数原样透传回去，便于返回时延续上下文
  const prepareSearch = useMemo(() => {
    const sp = new URLSearchParams(window.location.search)
    const out: Record<string, string | number | boolean | undefined> = {}
    const coerceNum = (v: string | null): number | string | undefined => {
      if (v == null) return undefined
      const n = Number(v)
      return Number.isNaN(n) ? v : n
    }
    const coerceBool = (v: string | null): boolean | undefined => {
      if (v == null) return undefined
      const raw = v.toLowerCase()
      if (raw === '' || raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false
      return true
    }
    const data = sp.get('data')
    if (data) out.data = data
    const jobId = sp.get('job_id')
    if (jobId) out.job_id = coerceNum(jobId) as number | string
    const invite = sp.get('invite_token')
    if (invite) out.invite_token = invite
    const skip = sp.get('isSkipConfirm')
    if (skip) out.isSkipConfirm = coerceBool(skip) as boolean
    const applyId = sp.get('job_apply_id')
    if (applyId) out.job_apply_id = coerceNum(applyId) as number | string
    const nodeId = sp.get('interview_node_id')
    if (nodeId) out.interview_node_id = coerceNum(nodeId) as number | string
    return out
  }, [])

  // const finishSubmit = useMemo(() => {
  //   // if (!previousPath) return true
  //   // try {
  //   //   const url = new URL(previousPath)
  //   //   return url.pathname !== '/invited'
  //   // } catch {
  //   //   return previousPath !== '/invited'
  //   // }
  //   return false
  // }, [])

  const handleSubmit = async (params: FeedbackParams) => {
    if (rating <= 0 || submitting) return
    setSubmitting(true)
    try {
      await fetchFeedback(params)
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
    try {
      await fetchForHelp({
        detail: _payload.message,
        need_contact: _payload.contactMethod === 'phone',
        phone_number: _payload.phone ?? '',
      })
      toast.success('提交成功')
    } catch (error) {
      handleServerError(error)
    }
  }

  const goNext = async () => {
    if (!interviewId || rating <= 0 || submitting) return
    // 低分时强制要求细分评分全部选择
    if (rating <= 4 && (flowScore <= 0 || expressionScore <= 0 || relevanceScore <= 0)) return
    // 当评分 <= 4 星时，额外上报自定义 APM 事件（不影响原有接口上报）
    if (rating <= 4) {
      try {
        const sp = new URLSearchParams(window.location.search)
        const jobId = sp.get('job_id') ?? undefined
        const jobApplyId = sp.get('job_apply_id') ?? undefined
        reportFinishFeedbackLowScore({
          interview_id: Number(interviewId),
          total_score: rating,
          flow_score: flowScore || undefined,
          expression_score: expressionScore || undefined,
          relevance_score: relevanceScore || undefined,
          feedback_text: feedback || undefined,
          job_id: jobId,
          job_apply_id: jobApplyId,
        })
      } catch (_e) { /* ignore */ }
    }
    await handleSubmit({
      interview_id: Number(interviewId),
      score: rating,
      feedback: feedback,
    })
    if (isMock) {
      navigate({
        to: '/mock-interview',
        search: { page: 1, pageSize: 12, q: '', category: undefined },
        replace: true,
      })
    } else {
      navigate({
        to: '/interview/prepare',
        search: prepareSearch as unknown as Record<string, unknown>,
        replace: true,
      })
    }
  }

  // 保留：如需在其它位置触发支持弹窗，可调用 setHelpOpen(true)

  return (
    <Main
      fixed
      className={`flex w-full items-center justify-center bg-[#ECD9FC]`}
    >
      {/* 右上角：寻求支持 */}
      <div className='absolute right-6 top-6'>
        <Button variant='link' className='text-primary' onClick={() => setHelpOpen(true)}>寻求支持</Button>
      </div>
      <section className='min-w-[418px] space-y-6'>
        <Card>
          <CardContent className='p-6'>
            <h2 className='mb-3 text-center text-[24px] font-semibold tracking-wide'>
              您的面试体验如何？
            </h2>
            <div className='mb-2 text-[18px] font-semibold'>整体评分</div>
            <div className='flex items-center gap-[10px]'>
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
                    <img src={filled ? filledStar : emptyStar} alt={filled ? 'filled-star' : 'empty-star'} className='h-8 w-8' />
                  </button>
                )
              })}
            </div>


            {rating > 0 && rating <= 4 && (
              <div className='mt-6 space-y-6'>
                <div>
                  <div className='mb-2 text-[18px] font-semibold'>面试过程流畅、无卡顿</div>
                  <div className='flex items-center gap-[10px]'>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1
                      const filled = (flowHover || flowScore) >= value
                      return (
                        <button
                          key={`flow-${value}`}
                          type='button'
                          aria-label={`流畅度评分 ${value}`}
                          onMouseEnter={() => setFlowHover(value)}
                          onMouseLeave={() => setFlowHover(0)}
                          onClick={() => setFlowScore(value)}
                          className='transition-transform hover:scale-105'
                        >
                          <img src={filled ? filledStar : emptyStar} alt={filled ? 'filled-star' : 'empty-star'} className='h-8 w-8' />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className='mb-2 text-[18px] font-semibold'>面试官表达自然、理解准确</div>
                  <div className='flex items-center gap-[10px]'>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1
                      const filled = (expressionHover || expressionScore) >= value
                      return (
                        <button
                          key={`exp-${value}`}
                          type='button'
                          aria-label={`表达理解评分 ${value}`}
                          onMouseEnter={() => setExpressionHover(value)}
                          onMouseLeave={() => setExpressionHover(0)}
                          onClick={() => setExpressionScore(value)}
                          className='transition-transform hover:scale-105'
                        >
                          <img src={filled ? filledStar : emptyStar} alt={filled ? 'filled-star' : 'empty-star'} className='h-8 w-8' />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className='mb-2 text-[18px] font-semibold'>面试问题与岗位和您的背景相符</div>
                  <div className='flex items-center gap-[10px]'>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1
                      const filled = (relevanceHover || relevanceScore) >= value
                      return (
                        <button
                          key={`rel-${value}`}
                          type='button'
                          aria-label={`相关性评分 ${value}`}
                          onMouseEnter={() => setRelevanceHover(value)}
                          onMouseLeave={() => setRelevanceHover(0)}
                          onClick={() => setRelevanceScore(value)}
                          className='transition-transform hover:scale-105'
                        >
                          <img src={filled ? filledStar : emptyStar} alt={filled ? 'filled-star' : 'empty-star'} className='h-8 w-8' />
                        </button>
                      )
                    })}
                  </div>

                  {rating > 0 && (
                    <div className='space-y-2 text-center mt-4'>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder='请填写您的反馈（可选）'
                        className='min-h-[151px] min-w-[458px]'
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='flex items-center justify-center'>
          <Button
            onClick={goNext}
            disabled={
              rating <= 0 || submitting || (rating <= 4 && (flowScore <= 0 || expressionScore <= 0 || relevanceScore <= 0))
            }
            className='h-[44px] w-[200px] bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)] text-white'
          >
            {
              isMock && !isCanceled ? '提交并生成面试报告' : '提交'
            }
          </Button>
        </div>
      </section>

      {/* {step === 2 && (
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
      )} */}

      {/* 寻求支持弹窗 */}
      <SupportDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        onSubmit={handleSupportSubmit}
      />
    </Main>
  )
}
