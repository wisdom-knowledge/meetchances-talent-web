
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  QuestionnaireNodeData, 
  QuestionnaireStatus, 
  CollectionStatus 
} from '../types/questionnaire'

// 问卷收集组件 - 集成飞书问卷

interface QuestionnaireCollectionProps {
  nodeData?: QuestionnaireNodeData
  jobApplyId?: string | number
}

// 获取问卷状态的 API 函数
async function fetchQuestionnaireStatus(nodeId: string | number): Promise<QuestionnaireNodeData> {
  const raw = await api.get('/talent/node/status', { params: { node_id: nodeId } })
  return raw as unknown as QuestionnaireNodeData
}

// 轮询问卷状态的 Hook
function useQuestionnaireStatusPolling(nodeId: string | number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['questionnaire-status', nodeId],
    queryFn: () => fetchQuestionnaireStatus(nodeId as string | number),
    enabled: Boolean(nodeId) && enabled,
    refetchInterval: 5000, // 每5秒轮询一次
    staleTime: 0, // 不使用缓存，每次都重新获取
  })
}

export default function QuestionnaireCollection({
  nodeData,
  jobApplyId
}: QuestionnaireCollectionProps) {
  const [currentNodeData, setCurrentNodeData] = useState(nodeData)
  
  // 当状态为未填写时启用轮询
  const shouldPoll = currentNodeData?.status === QuestionnaireStatus.NotFilled
  const { data: polledData, isLoading } = useQuestionnaireStatusPolling(
    currentNodeData?.id, 
    shouldPoll
  )
  
  // 更新节点数据
  useEffect(() => {
    if (polledData) {
      setCurrentNodeData(polledData)
    }
  }, [polledData])
  
  // 根据节点状态确定当前状态
  const getCurrentStatus = (): CollectionStatus => {
    const status = Number(currentNodeData?.status ?? 0)
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
  const questionnaireUrl = currentNodeData?.node_config?.url as string || 
                          currentNodeData?.node_config?.form_url as string ||
                          currentNodeData?.node_config?.questionnaire_url as string

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* 加载动画 */}
      <div className="mb-8">
        <img 
          src="https://dnu-cdn.xpertiise.com/common/942a2fdb-7d92-41a6-aff0-570ad59e6d31.svg" 
          alt="加载中" 
          className="w-50"
        />
      </div>

      {/* 根据状态显示不同内容 */}
      {currentStatus === 'not-filled' && (
        <div className="w-full max-w-4xl space-y-4">
          <div className="text-center space-y-2">
            <p className="text-gray-700 text-lg">
              请填写下方问卷,帮助我们更好地了解你
            </p>
            <p className="text-gray-600">
              你的专属申请ID是: <span className="font-bold">{jobApplyId || currentNodeData?.id || 'N/A'}</span>
            </p>
          </div>
          
          {questionnaireUrl && (
            <div className="w-full">
              <iframe
                src={questionnaireUrl}
                width="100%"
                height="600"
                frameBorder="0"
                className="rounded-lg shadow-lg"
                title="问卷填写"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
              />
            </div>
          )}
          
          {isLoading && (
            <div className="text-center text-gray-500">
              正在检查问卷状态...
            </div>
          )}
        </div>
      )}

      {currentStatus === 'pending-review' && (
        <div className="text-center space-y-4 max-w-md">
          <p className="text-gray-700 text-lg">
            已收到你提交的信息，请等待管理员审核
          </p>
        </div>
      )}

      {currentStatus === 'rejected' && (
        <div className="text-center space-y-4 max-w-lg">
          <p className="text-gray-700 text-lg leading-relaxed">
            感谢你对本岗位的关注。此次评估未能进入下一步流程,可
            <br />
            随时前往
            <a 
              href="/jobs" 
              className="text-blue-500 hover:text-blue-600 underline mx-1"
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
  )
}