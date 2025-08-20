import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import UploadCard from './components/upload-card'
import { UploadArea, type UploadResult } from '@/features/resume-upload/upload-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BackendStatus, UploadCardStatusCode } from './types'
import { Button } from '@/components/ui/button'
import { fetchResumes, type UploadResultItem } from './utils/api'

export interface FileItem {
  id: string
  name: string
  ext: string
  status_code: `${UploadCardStatusCode}`
  progress?: number
  numericStatus?: BackendStatus
  errorMsg?: string
  backend?: {
    id: number
  }
}

export default function ResumeUploadPage() {
  const [items, setItems] = useState<FileItem[]>([])
  const [tab, setTab] = useState<'running' | 'failed' | 'success'>('running')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

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
    // 改为调用 headhunter/resumes 接口（枚举值）
    const statusParam = tab === 'running' ? BackendStatus.InProgress : tab === 'success' ? BackendStatus.Success : BackendStatus.Failed
    const skip = (page - 1) * pageSize
    const res = await fetchResumes({ skip, limit: pageSize, status: statusParam })
    if (!res.success) return
    const refreshed: FileItem[] = res.data.map((r: UploadResultItem, idx: number) => ({
      id: `${r.backend.id}-${idx}`,
      name: r.data?.originalName || r.fileName || `文件_${idx + 1}`,
      ext: r.data?.ext || 'pdf',
      status_code: r.success ? UploadCardStatusCode.Success : mapErrorToStatus(undefined, r.status),
      numericStatus: r.status,
      errorMsg: r.error,
      progress: 100,
      backend: { id: r.backend.id },
    }))
    setItems(refreshed)
    setTotal(res.count)
  }

  // 首次加载与依赖变更时拉取当前 tab 列表
  useEffect(() => {
    void handleRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, pageSize])

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
            onUploadComplete={(_results: UploadResult[]) => {
              // 上传完成后，不再直接使用 upload 接口返回渲染，改为调用 headhunter/resumes 拉取
              void handleRefresh()
            }}
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
            <TabsList>
              <TabsTrigger value="running">进行中</TabsTrigger>
              <TabsTrigger value="failed">失败</TabsTrigger>
              <TabsTrigger value="success">成功</TabsTrigger>
            </TabsList>

            <TabsContent value="running">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.running.map((f) => (
                  <UploadCard key={f.id} fileName={f.name} fileExt={f.ext} status_code={f.status_code} />
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
                    errorMsg={f.errorMsg}
                    onRetryUpload={async () => {
                      // 失败项重试：重拉当前列表
                      await handleRefresh()
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

          {/* 简单分页器（与 users 的分页组件风格保持一致性可后续复用） */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">共 {total} 条</div>
            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border px-2"
                value={pageSize}
                onChange={(e) => {
                  setPage(1)
                  setPageSize(Number(e.target.value))
                }}
                aria-label="每页条数"
              >
                <option value={10}>10/页</option>
                <option value={20}>20/页</option>
                <option value={30}>30/页</option>
              </select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{'<'}</Button>
                <div className="text-sm">第 {page} 页</div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {'>'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}


