import { useEffect, useState } from 'react'
import {
  QuestionnaireStatus,
  CollectionStatus,
} from '../types/questionnaire'
import { Skeleton } from '@/components/ui/skeleton'
import { IconLoader2 } from '@tabler/icons-react'

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
  const nodeConfig = nodeData?.node_config as Record<string, unknown> | undefined
  const questionnaireUrl =
    (nodeConfig?.survey_link as string)

  // 若使用外链引导而非 iframe，确保不显示加载遮罩
  useEffect(() => {
    setIsLoading(false)
  }, [questionnaireUrl])

  // 预留 iframe 事件处理（当前未使用，若切回 iframe 再添加）

  return (
    <div className='h-full'>
      {/* 根据状态显示不同内容 */}
      {currentStatus === 'not-filled' ? (
        <div className='relative h-[calc(100vh-100px)] md:h-[calc(100vh-150px)] w-full mt-4 md:mt-0'>
          {/* 加载中状态 */}
          {isLoading && (
            <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-background'>
              <IconLoader2 className='mb-4 h-8 w-8 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>问卷加载中...</p>

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
            <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-background'>
              <div className='max-w-md space-y-4 text-center'>
                <p className='text-lg text-destructive'>问卷加载失败</p>
                <p className='text-sm text-muted-foreground'>
                  请检查网络连接或稍后重试
                </p>
                <button
                  onClick={() => {
                    setIsLoading(true)
                    setHasError(false)
                    // 强制重新加载 iframe
                    window.location.reload()
                  }}
                  className='rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90'
                >
                  重新加载
                </button>
              </div>
            </div>
          )}

          {/* iframe 内容 */}
          <div className='flex h-full w-full items-center justify-center'>
            {questionnaireUrl ? (
              <a
                href={questionnaireUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 underline hover:text-blue-700'
              >
                在新标签页回答问卷
              </a>
            ) : (
              <p className='text-sm text-muted-foreground'>未配置问卷链接</p>
            )}
          </div>
          {/* <iframe
            style={{ width: '100%', height: '100%', border: 'none' }}
            src={questionnaireUrl}
            title="问卷填写"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
          /> */}
        </div>
      ) : (
        <div className='flex min-h-[400px] h-full flex-col items-center justify-center p-8'>
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
