// 问卷收集相关类型定义

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
  NotFilled = 10,        // 未填写
  PendingReview = 20,   // 已填写待审核
  Rejected = 40,        // 被拒绝
}

// 问卷收集状态类型
export type CollectionStatus = 'not-filled' | 'pending-review' | 'rejected'
