

// 问卷收集组件 - 集成飞书问卷
import { IconLoader2 } from '@tabler/icons-react'
// 节点数据接口
export interface QuestionnaireNodeData {
  created_at?: string
  id?: number
  job_id?: number | null
  node_config?: Record<string, unknown>
  node_key?: string
  node_name?: string
  node_type?: string
  order_index?: number
  result_data?: Record<string, unknown> | null
  status?: number | string
  talent_id?: number | null
  updated_at?: string
  workflow_instance_id?: number
}

// 问卷状态枚举
export enum QuestionnaireStatus {
  NotFilled = 0,        // 未填写
  PendingReview = 20,   // 已填写待审核
  Rejected = 40,        // 被拒绝
}

// 问卷收集状态类型
export type CollectionStatus = 'not-filled' | 'pending-review' | 'rejected'

interface QuestionnaireCollectionProps {
  nodeData?: QuestionnaireNodeData
  jobApplyId?: string | number
}

export default function QuestionnaireCollection({
  nodeData,
  jobApplyId
}: QuestionnaireCollectionProps) {
  
  // 根据节点状态确定当前状态
  const getCurrentStatus = (): CollectionStatus => {
    const status = Number(nodeData?.status ?? 40)
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
  const questionnaireUrl = nodeData?.node_config?.url as string || 
                          nodeData?.node_config?.form_url as string ||
                          nodeData?.node_config?.questionnaire_url as string

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* 加载动画 */}
      <div className="mb-8">
        <IconLoader2 className="h-16 w-16 text-purple-500 animate-spin" />
      </div>

      {/* 根据状态显示不同内容 */}
      {currentStatus === 'not-filled' && (
        <div className="text-center space-y-4 max-w-md">
          <p className="text-gray-700 text-lg">
            请点击下方链接填写问卷,帮助我们更好地了解你
          </p>
          <a 
            href={questionnaireUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-blue-500 hover:text-blue-600 underline text-lg cursor-pointer"
          >
            问卷链接
          </a>
          <p className="text-gray-700">
            你的专属申请ID是: <span className="font-bold">{jobApplyId || nodeData?.id || 'N/A'}</span>
          </p>
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