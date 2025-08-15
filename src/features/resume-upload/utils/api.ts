import { api } from '@/lib/api'
import { BackendStatus } from '@/features/resume-upload/types'

export interface UploadBackendSubset {
  source: number
  status: BackendStatus
  struct_info: unknown
  is_in_pool: boolean
  is_del: boolean
  id: number
  user_id: number
}

export interface UploadResultItem {
  success: boolean
  status: BackendStatus
  data?: {
    fileName: string
    originalName: string
    url: string
    size: number
    ext: string
    compressed?: boolean
    originalSize?: number
    compressionRatio?: number
  }
  fileName?: string
  error?: string
  backend: UploadBackendSubset
}

// 对接后端：/api/v1/headhunter/upload_resume
// - 表单字段：files (可多文件)
// - 响应由 axios 拦截器解包后，返回 payload.data，即 { data: BackendItem[], count: number }
export async function uploadFiles(formData: FormData): Promise<{ success: boolean; data: UploadResultItem[] }> {
  try {
    // 注意：api 的 baseURL 默认为 /api/v1，因此这里仅写相对路径
    const res = (await api.post('/headhunter/upload_resume', formData)) as {
      data?: Array<{
        file_name: string
        file_size: number
        bucket_id?: string
        file_key?: string
        content_hash?: string
        source: number
        status: number
        struct_info: unknown
        is_in_pool: boolean
        is_del: boolean
        id: number
        user_id: number
      }>
      count?: number
    }

    const items = Array.isArray(res?.data) ? res.data : []
    const mapped: UploadResultItem[] = items.map((item) => {
      const fileName = item.file_name || '文件'
      const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
      const numericStatus = Number(item.status) as BackendStatus
      const isSuccess = numericStatus === BackendStatus.Success
      return {
        success: isSuccess,
        status: numericStatus,
        data: {
          fileName,
          originalName: fileName,
          url: '',
          size: Number(item.file_size) || 0,
          ext,
        },
        fileName,
        backend: {
          source: Number(item.source),
          status: numericStatus,
          struct_info: item.struct_info,
          is_in_pool: Boolean(item.is_in_pool),
          is_del: Boolean(item.is_del),
          id: Number(item.id),
          user_id: Number(item.user_id),
        },
      }
    })

    return { success: true, data: mapped }
  } catch (_e) {
    return { success: false, data: [] }
  }
}


