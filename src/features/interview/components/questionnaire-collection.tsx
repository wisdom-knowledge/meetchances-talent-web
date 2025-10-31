import { useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { QuestionnaireStatus, CollectionStatus } from '../types/questionnaire'

// 问卷收集组件 - 集成飞书问卷

interface QuestionnaireCollectionProps {
  nodeData?: Record<string, unknown>
}

export default function QuestionnaireCollection({
  nodeData,
}: QuestionnaireCollectionProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // 根据节点状态确定当前状态
  const getCurrentStatus = (): CollectionStatus => {
    const status = Number(nodeData?.status ?? 0)
    switch (status) {
      case QuestionnaireStatus.NotFilled:
        return 'not-filled'
      case QuestionnaireStatus.PendingReview:
        return 'pending-review'
      case QuestionnaireStatus.Rejected:
        return 'rejected'
      default:
        return 'not-filled'
    }
  }

  const currentStatus = getCurrentStatus()

  // 从nodeData中获取问卷链接
  const nodeConfig = nodeData?.node_config as
    | Record<string, unknown>
    | undefined
  const questionnaireUrl = nodeConfig?.survey_link as string

  // iframe 加载完成
  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  // iframe 加载失败
  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className='h-full'>
      {/* 根据状态显示不同内容 */}
      {currentStatus === 'not-filled' ? (
        <div className='relative mt-4 h-[calc(100vh-100px)] w-full md:mt-0 md:h-[calc(100vh-150px)]'>
          {/* 加载中状态 */}
          {isLoading && (
            <div className='bg-background absolute inset-0 z-10 flex flex-col items-center justify-center'>
              <IconLoader2 className='text-primary mb-4 h-8 w-8 animate-spin' />
              <p className='text-muted-foreground text-sm'>问卷加载中...</p>

              {/* 骨架屏 */}
              <div className='mt-8 w-full max-w-2xl space-y-4 px-8'>
                <Skeleton className='h-8 w-3/4' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
                <div className='space-y-2 pt-4'>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                </div>
                <Skeleton className='h-12 w-32' />
              </div>
            </div>
          )}

          {/* 加载错误状态 */}
          {hasError && (
            <div className='bg-background absolute inset-0 z-10 flex flex-col items-center justify-center'>
              <div className='max-w-md space-y-4 text-center'>
                <p className='text-destructive text-lg'>问卷加载失败</p>
                <p className='text-muted-foreground text-sm'>
                  请检查网络连接或稍后重试
                </p>
                <button
                  onClick={() => {
                    setIsLoading(true)
                    setHasError(false)
                    // 强制重新加载 iframe
                    window.location.reload()
                  }}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm'
                >
                  重新加载
                </button>
              </div>
            </div>
          )}
          {/* iframe 内容 */}
          <iframe
            style={{ width: '100%', height: '100%', border: 'none' }}
            src={questionnaireUrl}
            title='问卷填写'
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className={
              isLoading
                ? 'opacity-0'
                : 'opacity-100 transition-opacity duration-300'
            }
          />
        </div>
      ) : (
        <div className='flex h-full min-h-[400px] flex-col items-center justify-center p-8'>
          <div className='mb-8'>
            <img
              src='https://dnu-cdn.xpertiise.com/common/942a2fdb-7d92-41a6-aff0-570ad59e6d31.svg'
              alt='一面千识'
              className='w-50'
            />
          </div>

          {currentStatus === 'pending-review' && (
            <div className='max-w-md space-y-4 text-center'>
              <p className='text-lg text-gray-700'>
                已收到你提交的信息，请等待管理员审核
              </p>
            </div>
          )}

          {currentStatus === 'rejected' && (
            <div className='max-w-lg space-y-4 text-center'>
              <p className='text-lg leading-relaxed text-gray-700'>
                感谢你对本岗位的关注。此次评估未能进入下一步流程,可
                <br />
                随时前往
                <a
                  href='/jobs'
                  className='mx-1 text-blue-500 underline hover:text-blue-600'
                  onClick={(e) => {
                    e.preventDefault()
                    // 这里可以添加路由跳转逻辑
                    window.location.href = '/jobs'
                  }}
                >
                  职位列表
                </a>
                查看当前在招职位,期待未来有机会合作
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
