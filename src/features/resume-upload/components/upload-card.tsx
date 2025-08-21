import { FileIcon, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'
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
  errorMsg?: string
}

const statusTextMap: Record<UploadStatusCode, string> = {
  [UploadCardStatusCode.Queued]: '正在上传中',
  [UploadCardStatusCode.Uploading]: '正在解析中，预计需要5分钟',
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
  errorMsg,
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
                  <span className="text-destructive">{errorMsg || statusTextMap[status_code]}</span>
                </>
              ) : status_code === UploadCardStatusCode.Success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{statusTextMap[status_code]}</span>
                </>
              ) : status_code === UploadCardStatusCode.Uploading ? (
                <UploadingTicker />
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


function UploadingTicker() {
  const controls = useAnimation()

  useEffect(() => {
    let isActive = true
    async function loop() {
      while (isActive) {
        // 显示第1行 3s
        await controls.start({ y: 0, transition: { duration: 0 } })
        await new Promise((r) => setTimeout(r, 3000))
        // 向上翻到第2行（0.5s）并停留 3s
        await controls.start({ y: -20, transition: { duration: 0.5, ease: 'easeInOut' } })
        await new Promise((r) => setTimeout(r, 3000))
        // 向上翻到第3行（复制的第1行）
        await controls.start({ y: -40, transition: { duration: 0.5, ease: 'easeInOut' } })
        // 立即复位到初始位置，形成“始终向上”的循环
        await controls.start({ y: 0, transition: { duration: 0 } })
      }
    }
    void loop()
    return () => {
      isActive = false
    }
  }, [controls])

  return (
    <div className="flex items-center gap-2">
      <Upload className="h-4 w-4 text-primary" />
      <div className="relative h-5 overflow-hidden">
        <motion.div className="flex flex-col" animate={controls}>
          <span className="leading-5">正在解析中</span>
          <span className="leading-5">预计需要5分钟</span>
          {/* 复制一份第一行，便于始终向上滚动 */}
          <span className="leading-5">正在解析中</span>
        </motion.div>
      </div>
    </div>
  )
}


