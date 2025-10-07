import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MockInterviewTab } from '@/features/mock-interview/constants'
import { handleServerError } from '@/utils/handle-server-error'
import { Button } from '@/components/ui/button'
import { Main } from '@/components/layout/main'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import { FeedbackParams, fetchFeedback } from './api'
import { reportFinishFeedbackLowScore } from '@/lib/apm'
import { useJobDetailQuery } from '@/features/jobs/api'
import { IconLoader2 } from '@tabler/icons-react'
import { useIsMobile } from '@/hooks/use-mobile'
import DesktopLayout from './components/desktop-layout'
import MobileLayout from './components/mobile-layout'


export default function FinishPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
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
  const { data: job, isLoading: isJobLoading } = useJobDetailQuery(jobId, Boolean(jobId))
  const isMock = useMemo(() => job?.job_type === 'mock_job', [job])


  // 是否为主动取消面试：仅接受 'true' / 'false' 或无该参数
  const isCanceled = useMemo(() => {
    const sp = new URLSearchParams(window.location.search)
    const val = sp.get('is_canceled') ?? sp.get('isCanceled')
    return val === 'true'
  }, [])

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
        search: { 
          page: 1, 
          pageSize: 12, 
          q: '', 
          category: undefined, 
          tab: !isCanceled ? MockInterviewTab.RECORDS : undefined 
        },
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

  // 如果正在加载 job 数据，显示加载状态
  if (isJobLoading && jobId) {
    return (
      <Main
        fixed
        className={`flex w-full items-center justify-center bg-[#ECD9FC]`}
      >
        <div className='flex items-center gap-2 text-primary'>
          <IconLoader2 className='h-5 w-5 animate-spin' />
          <span>正在加载...</span>
        </div>
      </Main>
    )
  }

  return (
    <>
      {isMobile ? (
        <>
          <MobileLayout
            rating={rating}
            hoverRating={hoverRating}
            setRating={setRating}
            setHoverRating={setHoverRating}
            flowScore={flowScore}
            flowHover={flowHover}
            setFlowScore={setFlowScore}
            setFlowHover={setFlowHover}
            expressionScore={expressionScore}
            expressionHover={expressionHover}
            setExpressionScore={setExpressionScore}
            setExpressionHover={setExpressionHover}
            relevanceScore={relevanceScore}
            relevanceHover={relevanceHover}
            setRelevanceScore={setRelevanceScore}
            setRelevanceHover={setRelevanceHover}
            onSubmit={goNext}
            submitting={submitting}
          />
        </>
      ) : (
        <Main fixed className='flex w-full items-center justify-center bg-[#ECD9FC]'>
          {/* 右上角：寻求支持 */}
          <div className='absolute right-6 top-6'>
            <Button variant='link' className='text-primary' onClick={() => setHelpOpen(true)}>
              寻求支持
            </Button>
          </div>

          <DesktopLayout
            rating={rating}
            hoverRating={hoverRating}
            setRating={setRating}
            setHoverRating={setHoverRating}
            flowScore={flowScore}
            flowHover={flowHover}
            setFlowScore={setFlowScore}
            setFlowHover={setFlowHover}
            expressionScore={expressionScore}
            expressionHover={expressionHover}
            setExpressionScore={setExpressionScore}
            setExpressionHover={setExpressionHover}
            relevanceScore={relevanceScore}
            relevanceHover={relevanceHover}
            setRelevanceScore={setRelevanceScore}
            setRelevanceHover={setRelevanceHover}
            feedback={feedback}
            setFeedback={setFeedback}
            onSubmit={goNext}
            submitting={submitting}
            isMock={isMock}
            isCanceled={isCanceled}
          />

          {/* 寻求支持弹窗 */}
          <SupportDialog open={helpOpen} onOpenChange={setHelpOpen} />
        </Main>
      )}
    </>
  )
}
