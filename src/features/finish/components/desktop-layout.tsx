import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { RatingStars } from './rating-stars'
import { mainQuestion, detailQuestions } from '../data/questions'

interface DesktopLayoutProps {
  rating: number
  hoverRating: number
  setRating: (value: number) => void
  setHoverRating: (value: number) => void
  flowScore: number
  flowHover: number
  setFlowScore: (value: number) => void
  setFlowHover: (value: number) => void
  expressionScore: number
  expressionHover: number
  setExpressionScore: (value: number) => void
  setExpressionHover: (value: number) => void
  relevanceScore: number
  relevanceHover: number
  setRelevanceScore: (value: number) => void
  setRelevanceHover: (value: number) => void
  feedback: string
  setFeedback: (value: string) => void
  onSubmit: () => void
  submitting: boolean
  isMock: boolean
  isCanceled: boolean
}

export default function DesktopLayout({
  rating,
  hoverRating,
  setRating,
  setHoverRating,
  flowScore,
  flowHover,
  setFlowScore,
  setFlowHover,
  expressionScore,
  expressionHover,
  setExpressionScore,
  setExpressionHover,
  relevanceScore,
  relevanceHover,
  setRelevanceScore,
  setRelevanceHover,
  feedback,
  setFeedback,
  onSubmit,
  submitting,
  isMock,
  isCanceled,
}: DesktopLayoutProps) {
  const scores = {
    flow: { value: flowScore, hover: flowHover, setValue: setFlowScore, setHover: setFlowHover },
    expression: { value: expressionScore, hover: expressionHover, setValue: setExpressionScore, setHover: setExpressionHover },
    relevance: { value: relevanceScore, hover: relevanceHover, setValue: setRelevanceScore, setHover: setRelevanceHover },
  }

  const isSubmitDisabled =
    rating <= 0 ||
    submitting ||
    (rating <= 4 && (flowScore <= 0 || expressionScore <= 0 || relevanceScore <= 0))

  const showDetailQuestions = rating > 0 && rating <= 4

  return (
    <section className='w-[460px] space-y-6'>
      {/* Logo - 动态尺寸 */}
      <div className='flex justify-center mb-8'>
        <img
          src='https://dnu-cdn.xpertiise.com/design-assets/logo-and-text-no-padding.svg'
          alt='MeetChances Logo'
          className='h-auto'
          style={{ width: showDetailQuestions ? '88px' : '200px' }}
        />
      </div>

      <Card>
        <CardContent className='p-6'>
          <h2 className='mb-6 text-center text-[24px] font-semibold tracking-wide'>
            您的面试体验如何？
          </h2>

          {/* 主评分 */}
          <div className='mb-6'>
            <div className='mb-3 text-center text-base font-normal text-black/70 leading-[150%] tracking-[0.32px]'>
              {mainQuestion.label}
            </div>
            <div className='flex justify-center'>
              <RatingStars
                value={rating}
                hoverValue={hoverRating}
                onChange={setRating}
                onHoverChange={setHoverRating}
                ariaLabelPrefix='整体评分'
              />
            </div>
          </div>

          {/* 细分评分（低分时显示） */}
          {showDetailQuestions && (
            <div className='mt-6 space-y-6'>
              {detailQuestions.map((question) => {
                const score = scores[question.id as keyof typeof scores]
                return (
                  <div key={question.id}>
                    <div className='mb-3 text-center text-base font-normal text-black/70 leading-[150%] tracking-[0.32px]'>
                      {question.label}
                    </div>
                    <div className='flex justify-center'>
                      <RatingStars
                        value={score.value}
                        hoverValue={score.hover}
                        onChange={score.setValue}
                        onHoverChange={score.setHover}
                        ariaLabelPrefix={question.label}
                      />
                    </div>
                  </div>
                )
              })}

              {/* 反馈文本框 */}
              <div className='space-y-2 pt-2'>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder='请填写您的反馈（可选）'
                  className='min-h-[151px]'
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className='flex items-center justify-center'>
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className='h-[44px] w-[200px] bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)] text-white'
        >
          {isMock && !isCanceled ? '提交并生成面试报告' : '提交'}
        </Button>
      </div>
    </section>
  )
}

