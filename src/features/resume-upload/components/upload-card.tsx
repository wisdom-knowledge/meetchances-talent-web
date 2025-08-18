import { FileIcon, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UploadCardStatusCode } from '@/features/resume-upload/types'

export type UploadStatusCode = `${UploadCardStatusCode}`

export interface UploadCardProps {
  fileName: string
  fileExt?: string
  status_code: UploadStatusCode
  onRetryUpload?: () => void
  onRetryParse?: () => void
  onRetryImport?: () => void
}

const statusTextMap: Record<UploadStatusCode, string> = {
  [UploadCardStatusCode.Queued]: '正在上传中',
  [UploadCardStatusCode.Uploading]: '正在解析中',
  [UploadCardStatusCode.Uploaded]: '上传完成',
  [UploadCardStatusCode.Parsing]: '正在解析中',
  [UploadCardStatusCode.Parsed]: '解析完成',
  [UploadCardStatusCode.Importing]: '候选人信息录入中',
  [UploadCardStatusCode.Success]: '上传成功',
  [UploadCardStatusCode.UploadFailed]: '上传失败',
  [UploadCardStatusCode.FormatUnsupported]: '文件格式不支持',
  [UploadCardStatusCode.FileCorrupted]: '文件损坏',
  [UploadCardStatusCode.ExceedLimit]: '简历超出上传限制',
  [UploadCardStatusCode.ParseFailed]: '解析失败',
  [UploadCardStatusCode.ParseAbnormal]: '解析内容异常',
  [UploadCardStatusCode.ImportFailed]: '录入失败',
  [UploadCardStatusCode.ImportMissingInfo]: '录入中缺失信息',
  [UploadCardStatusCode.DuplicateExists]: '已在系统中存在',
}

export default function UploadCard({
  fileName,
  status_code,
  onRetryUpload,
  onRetryParse,
  onRetryImport,
}: UploadCardProps) {
  const isError = status_code.includes('failed') ||
    status_code === UploadCardStatusCode.FormatUnsupported ||
    status_code === UploadCardStatusCode.FileCorrupted ||
    status_code === UploadCardStatusCode.ExceedLimit ||
    status_code === UploadCardStatusCode.ParseAbnormal

  const retryAction = () => {
    if (status_code === UploadCardStatusCode.UploadFailed || status_code === UploadCardStatusCode.FormatUnsupported || status_code === UploadCardStatusCode.FileCorrupted) {
      onRetryUpload?.()
    } else if (status_code === UploadCardStatusCode.ParseFailed || status_code === UploadCardStatusCode.ParseAbnormal) {
      onRetryParse?.()
    } else if (status_code === UploadCardStatusCode.ImportFailed || status_code === UploadCardStatusCode.ImportMissingInfo) {
      onRetryImport?.()
    }
  }

  const showRetry =
    status_code === UploadCardStatusCode.UploadFailed ||
    status_code === UploadCardStatusCode.FormatUnsupported ||
    status_code === UploadCardStatusCode.FileCorrupted ||
    status_code === UploadCardStatusCode.ParseFailed ||
    status_code === UploadCardStatusCode.ParseAbnormal ||
    status_code === UploadCardStatusCode.ImportFailed ||
    status_code === UploadCardStatusCode.ImportMissingInfo

  return (
    <Card className={cn('border-primary/30')}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <FileIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{fileName}</div>
            <div className={cn('text-sm text-muted-foreground flex items-center gap-2')}
            >
              {isError ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{statusTextMap[status_code]}</span>
                </>
              ) : status_code === UploadCardStatusCode.Success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{statusTextMap[status_code]}</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-primary" />
                  <span>{statusTextMap[status_code]}</span>
                </>
              )}
            </div>

          </div>

          {showRetry && (
            <Button size="sm" variant="secondary" onClick={retryAction}>
              {status_code === UploadCardStatusCode.ParseFailed || status_code === UploadCardStatusCode.ParseAbnormal ? '重新解析' : status_code.startsWith('import_') ? '重新录入' : '重新上传'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


