import { api } from '@/lib/api'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
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
  // 本地增强：便于“重新上传”时复用原始文件
  originalFile?: File
}

type BackendItem = {
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
}

function mapBackendItems(items: BackendItem[]): UploadResultItem[] {
  return items.map((item) => {
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
}

// 对接后端：/api/v1/headhunter/upload_resume
// - 表单字段：files (可多文件)
// - 响应由 axios 拦截器解包后，返回 payload.data，即 { data: BackendItem[], count: number }
export async function uploadFiles(formData: FormData): Promise<{ success: boolean; data: UploadResultItem[] }> {
  try {
    // 注意：api 的 baseURL 默认为 /api/v1，因此这里仅写相对路径
    const res = (await api.post('/headhunter/upload_resume', formData)) as {
      data?: BackendItem[]
      count?: number
    }

    const items = Array.isArray(res?.data) ? res.data : []
    return { success: true, data: mapBackendItems(items) }
  } catch (_e) {
    return { success: false, data: [] }
  }
}

// 刷新上传结果
export async function fetchResumesByIds(resumeIds: number[]): Promise<{ success: boolean; data: UploadResultItem[] }> {
  try {
    const res = (await api.get('/headhunter/resumes', { params: { resume_ids: resumeIds.join(',') } })) as {
      data?: BackendItem[]
      count?: number
    }
    const items = Array.isArray(res?.data) ? res.data : []
    return { success: true, data: mapBackendItems(items) }
  } catch (_e) {
    return { success: false, data: [] }
  }
}

// TanStack hooks
export function useResumesRefreshMutation(
  options?: UseMutationOptions<{ success: boolean; data: UploadResultItem[] }, unknown, number[]>
) {
  return useMutation({ mutationFn: (ids: number[]) => fetchResumesByIds(ids), ...options })
}

export function useUploadResumesMutation(
  options?: UseMutationOptions<{ success: boolean; data: UploadResultItem[] }, unknown, FormData>
) {
  return useMutation({ mutationFn: (fd: FormData) => uploadFiles(fd), ...options })
}


