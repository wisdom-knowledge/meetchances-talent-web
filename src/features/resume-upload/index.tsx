import { useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import UploadCard from './components/upload-card'
import { UploadArea, type UploadResult } from '@/features/resume-upload/upload-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BackendStatus, UploadCardStatusCode } from './types'
import { Button } from '@/components/ui/button'
import { fetchResumesByIds, type UploadResultItem } from './utils/api'

export interface FileItem {
  id: string
  name: string
  ext: string
  status_code: `${UploadCardStatusCode}`
  progress?: number
  numericStatus?: BackendStatus
  backend?: {
    id: number
  }
}

export default function ResumeUploadPage() {
  const [items, setItems] = useState<FileItem[]>([])

  const mapErrorToStatus = (error?: string, backendStatus?: BackendStatus): `${UploadCardStatusCode}` => {
    // 优先按后端数值状态映射
    if (backendStatus === BackendStatus.InProgress) return UploadCardStatusCode.Uploading
    if (backendStatus === BackendStatus.Success) return UploadCardStatusCode.Success
    if (backendStatus === BackendStatus.Failed) return UploadCardStatusCode.UploadFailed
    if (backendStatus === BackendStatus.ParseFailed) return UploadCardStatusCode.ParseFailed
    if (backendStatus === BackendStatus.ImportMissingInfo) return UploadCardStatusCode.ImportMissingInfo
    switch (error) {
      case '文件格式不支持':
        return UploadCardStatusCode.FormatUnsupported
      case '文件损坏':
        return UploadCardStatusCode.FileCorrupted
      case '解析失败':
        return UploadCardStatusCode.ParseFailed
      case '解析内容异常':
        return UploadCardStatusCode.ParseAbnormal
      case '录入失败':
        return UploadCardStatusCode.ImportFailed
      case '录入中缺失信息':
        return UploadCardStatusCode.ImportMissingInfo
      case '简历超出上传限制':
        return UploadCardStatusCode.ExceedLimit
      default:
        return UploadCardStatusCode.UploadFailed
    }
  }

  const groups = useMemo(() => {
    // 优先使用接口返回的数字状态分组：0-进行中 10-成功 20/30/31-失败
    const running = items.filter((i) => i.numericStatus === BackendStatus.InProgress)
    const success = items.filter((i) => i.numericStatus === BackendStatus.Success)
    const failed = items.filter(
      (i) =>
        i.numericStatus === BackendStatus.Failed ||
        i.numericStatus === BackendStatus.ParseFailed ||
        i.numericStatus === BackendStatus.ImportMissingInfo
    )
    return { running, failed, success }
  }, [items])

  async function handleRefresh() {
    const ids = items
      .map((i) => Number(i.backend?.id ?? NaN))
      .filter((n): n is number => Number.isFinite(n))
    if (ids.length === 0) return
    const res = await fetchResumesByIds(ids)
    if (!res.success) return
    const refreshed: FileItem[] = res.data.map((r: UploadResultItem, idx: number) => ({
      id: `${Date.now()}-${idx}`,
      name: r.data?.originalName || r.fileName || `文件_${idx + 1}`,
      ext: r.data?.ext || 'pdf',
      status_code: r.success ? UploadCardStatusCode.Success : mapErrorToStatus(undefined, r.status),
      numericStatus: r.status,
      progress: 100,
      backend: { id: r.backend.id },
    }))
    setItems(refreshed)
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>批量上传简历</h1>
              <p className='text-muted-foreground'>每个简历解析大概会花费1分钟</p>
            </div>
            {items.length > 0 && (
              <Button variant='outline' onClick={handleRefresh}>刷新</Button>
            )}
          </div>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='space-y-6'>
          <UploadArea
            onUploadComplete={(results: UploadResult[]) => {
              const mapped: FileItem[] = results.map((r: UploadResult, idx: number) => ({
                id: r.backend.id.toString(),
                name: r.data?.originalName || r.fileName || `文件_${idx + 1}`,
                ext: r.data?.ext || 'pdf',
                status_code:
                  r.status === BackendStatus.InProgress
                    ? UploadCardStatusCode.Uploading
                    : r.success
                      ? UploadCardStatusCode.Success
                      : mapErrorToStatus(r.error, r.status as BackendStatus),
                numericStatus: (r.status as BackendStatus) ?? BackendStatus.InProgress,
                progress: 100,
                backend: { id: r.backend.id },
              }))
              setItems((prev) => [...mapped, ...prev])
            }}
          />

          <Tabs defaultValue="running" className="w-full">
            <TabsList>
              <TabsTrigger value="running">进行中({groups.running.length})</TabsTrigger>
              <TabsTrigger value="failed">失败({groups.failed.length})</TabsTrigger>
              <TabsTrigger value="success">成功({groups.success.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="running">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.running.map((f) => (
                  <UploadCard key={f.id} fileName={f.name} fileExt={f.ext} status_code={f.status_code} progress={f.progress} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="failed">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.failed.map((f) => (
                  <UploadCard
                    key={f.id}
                    fileName={f.name}
                    fileExt={f.ext}
                    status_code={f.status_code}
                    onRetryUpload={async () => {
                      // 重传失败文件：调用刷新接口拿到后端记录（此处假定需要重新选文件，若后端支持后端直连重试，可替换为对应接口）
                      const res = await fetchResumesByIds([Number(f.backend?.id)])
                      if (!res.success) return
                      // 仅刷新该条状态
                      const r = res.data[0]
                      setItems((prev) =>
                        prev.map((it) =>
                          it.id === f.id
                            ? {
                                ...it,
                                status_code: r.success ? UploadCardStatusCode.Success : mapErrorToStatus(undefined, r.status),
                                numericStatus: r.status,
                                progress: 100,
                                backend: { id: r.backend.id },
                              }
                            : it
                        )
                      )
                    }}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="success">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.success.map((f) => (
                  <UploadCard key={f.id} fileName={f.name} fileExt={f.ext} status_code={f.status_code} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}


