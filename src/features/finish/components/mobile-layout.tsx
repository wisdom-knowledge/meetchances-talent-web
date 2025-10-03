import { Button } from '@/components/ui/button'
import { RatingStars } from './rating-stars'
import { mainQuestion, detailQuestions } from '../data/questions'

interface MobileLayoutProps {
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
  onSubmit: () => void
  submitting: boolean
}

export default function MobileLayout({
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
  onSubmit,
  submitting,
}: MobileLayoutProps) {
  const scores = {
    flow: { value: flowScore, hover: flowHover, setValue: setFlowScore, setHover: setFlowHover },
    expression: {
      value: expressionScore,
      hover: expressionHover,
      setValue: setExpressionScore,
      setHover: setExpressionHover,
    },
    relevance: {
      value: relevanceScore,
      hover: relevanceHover,
      setValue: setRelevanceScore,
      setHover: setRelevanceHover,
    },
  }

  const isSubmitDisabled =
    rating <= 0 ||
    submitting ||
    (rating <= 4 && (flowScore <= 0 || expressionScore <= 0 || relevanceScore <= 0))

  const showDetailQuestions = rating > 0 && rating <= 4

  return (
    <div className='fixed inset-0 flex flex-col justify-center  bg-gradient-to-b from-purple-100 to-purple-200 px-6 py-8'>
      {/* Logo - 动态尺寸 */}
      <div className='flex justify-center mb-8'>
        <img
          src='https://dnu-cdn.xpertiise.com/design-assets/logo-and-text-no-padding.svg'
          alt='MeetChances Logo'
          className='h-auto'
          style={{ width: showDetailQuestions ? '88px' : '40vw' }}
        />
      </div>

      {/* 主内容卡片 */}
      <div className='flex flex-col items-center'>
        <div className='w-full max-w-md bg-white rounded-lg p-6 shadow-lg'>
          <h2 className='mb-8 text-center text-xl font-bold text-gray-900'>您的面试体验如何？</h2>

          {/* 主评分 */}
          <div className='mb-6'>
            <div className='mb-3 text-left text-base font-normal text-black/70 leading-[150%] tracking-[0.32px]'>
              {mainQuestion.label}
            </div>
            <RatingStars
              value={rating}
              hoverValue={hoverRating}
              onChange={setRating}
              onHoverChange={setHoverRating}
              ariaLabelPrefix='整体评分'
              className='gap-2'
            />
          </div>

          {/* 细分评分（低分时显示） */}
          {showDetailQuestions && (
            <div className='space-y-6'>
              {detailQuestions.map((question) => {
                const score = scores[question.id as keyof typeof scores]
                return (
                  <div key={question.id}>
                    <div className='mb-3 text-left text-base font-normal text-black/70 leading-[150%] tracking-[0.32px]'>
                      {question.label}
                    </div>
                    <RatingStars
                      value={score.value}
                      hoverValue={score.hover}
                      onChange={score.setValue}
                      onHoverChange={score.setHover}
                      ariaLabelPrefix={question.label}
                      className='gap-2'
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* 提交按钮 */}
          <div className='mt-8 flex justify-center'>
            <Button
              onClick={onSubmit}
              disabled={isSubmitDisabled}
              className=' w-[200px] bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)] text-white'
            >
              提交
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

