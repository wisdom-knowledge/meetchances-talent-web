import {
  QuestionnaireStatus,
  CollectionStatus,
} from '../types/questionnaire'

// 问卷收集组件 - 集成飞书问卷

interface QuestionnaireCollectionProps {
  nodeData?: Record<string, unknown>
}

export default function QuestionnaireCollection({
  nodeData,
}: QuestionnaireCollectionProps) {

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
    
  return (
    <div className='h-full'>
      {/* 根据状态显示不同内容 */}
      {currentStatus === 'not-filled' ? (
        <div className='h-[calc(100vh-200px)] w-full'>
          <iframe 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            src={questionnaireUrl}
            title="问卷填写"
          />
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
