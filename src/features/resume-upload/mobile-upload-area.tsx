import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { IconUpload, IconLoader2 } from '@tabler/icons-react'
import { uploadTalentResume } from '@/features/resume-upload/utils/api'
import type { ResumeFormValues } from '@/features/resume/data/schema'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MobileUploadAreaProps {
  resumeValues: ResumeFormValues | null
  uploadingResume: boolean
  onResumeOpen: () => void
  onUploadingChange: (uploading: boolean) => void
  onUploadComplete: (results: Array<{ success: boolean; backend?: { struct_info?: unknown } }>) => void
  onUploadEvent: (action: string) => void
}

export function MobileUploadArea({
  resumeValues,
  uploadingResume,
  onResumeOpen,
  onUploadingChange,
  onUploadComplete,
  onUploadEvent,
}: MobileUploadAreaProps) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return
    const file = files[0]
    if (!file) return

    // 验证文件类型
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isWord =
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.doc')

    if (!isPDF && !isWord) {
      toast.error('仅支持上传 PDF 或 Word 格式的简历文件')
      return
    }

    onUploadingChange(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await uploadTalentResume(formData)

      if (response.success) {
        toast.success('简历上传成功')
        onUploadComplete(response.data)
      } else {
        toast.error('上传失败')
      }
    } catch (error) {
      const err = error as { message?: string }
      toast.error(`上传失败：${err?.message || '未知错误'}`)
    } finally {
      onUploadingChange(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = (event.target.files && event.target.files[0]) || null
    handleUpload(file ? [file] : [])
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files && event.dataTransfer.files[0]
    handleUpload(file ? [file] : [])
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleClick = () => {
    onUploadEvent(resumeValues ? 'update' : 'upload')
    fileInputRef.current?.click()
  }

  // 未上传状态
  if (!resumeValues) {
    return (
      <div className='w-full'>
        <input
          ref={fileInputRef}
          type='file'
          className='hidden'
          accept='.pdf,.doc,.docx'
          onChange={handleFileSelect}
          disabled={uploadingResume}
          aria-label='选择简历文件'
          title='选择简历文件'
        />
        <div
          className={cn(
            'w-full inline-flex h-[127px] justify-center items-center flex-shrink-0 rounded-lg border border-dashed border-[rgba(78,2,228,0.20)] bg-[rgba(78,2,228,0.05)] cursor-pointer transition-all relative',
            dragOver && 'scale-[1.02] border-primary',
            uploadingResume && 'pointer-events-none'
          )}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploadingResume ? (
            <div className='flex flex-col items-center'>
              <IconLoader2 className='h-8 w-8 text-primary animate-spin mb-3' />
              <p className='text-sm font-medium text-foreground'>正在上传并分析简历…</p>
            </div>
          ) : (
            <div className='flex flex-col items-center'>
              <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3'>
                <IconUpload className='h-6 w-6 text-primary' />
              </div>
              <p className='text-sm font-medium text-foreground'>点击上传简历</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 已上传状态
  return (
    <div>
      <input
        ref={fileInputRef}
        type='file'
        className='hidden'
        accept='.pdf,.doc,.docx'
        onChange={handleFileSelect}
        disabled={uploadingResume}
        aria-label='选择简历文件'
        title='选择简历文件'
      />
      <div
        className={cn(
          'flex flex-col w-full min-h-[127px] justify-center items-center rounded-lg border border-dashed border-[rgba(78,2,228,0.20)] bg-[rgba(78,2,228,0.05)] px-4 py-4 relative',
          uploadingResume && 'pointer-events-none'
        )}
      >
        {uploadingResume ? (
          <div className='flex flex-col items-center'>
            <IconLoader2 className='h-8 w-8 text-primary animate-spin mb-3' />
            <p className='text-sm font-medium text-foreground'>正在上传并分析简历…</p>
          </div>
        ) : (
          <>
            <div className='bg-white p-3 border border-border rounded-lg flex flex-col w-full'>
              {/* 简历信息 */}
              <div className='flex items-center justify-between w-full'>
                <div className='flex flex-col min-w-0 flex-1'>
                  <div className='font-medium text-foreground text-sm truncate'>
                    姓名：{resumeValues.name || '—'}
                  </div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    电话：{resumeValues.phone || '—'}
                  </div>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={(e) => {
                    e.stopPropagation()
                    onResumeOpen()
                  }}
                  className='shrink-0 ml-3'
                >
                  点击查看
                </Button>
              </div>
            </div>
            {/* 更新简历链接 */}
            <div className='text-center mt-4'>
              <button
                type='button'
                onClick={handleClick}
                className='text-sm text-primary hover:underline underline-offset-2 font-medium'
              >
                更新简历
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

