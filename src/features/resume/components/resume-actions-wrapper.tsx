import { Button } from '@/components/ui/button'
import { IconLoader2, IconUpload } from '@tabler/icons-react'

interface ResumeActionsWrapperProps {
  variant: 'top' | 'bottom'
  uploading: boolean
  onUpload: () => void
  onSave: () => void
}

export default function ResumeActionsWrapper({ variant, uploading, onUpload, onSave }: ResumeActionsWrapperProps) {
  const outerClass =
    variant === 'top'
      ? 'w-full mb-6 hidden md:block'
      : 'w-full md:hidden sticky bottom-0 z-10 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]'
  return (
    <div className={outerClass}>
      <div className='flex items-center justify-end'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              if (uploading) return
              onUpload()
            }}
            className='h-10 px-4 py-2'
            disabled={uploading}
          >
            {uploading ? (
              <>
                <IconLoader2 className='h-4 w-4 animate-spin' /> 正在上传…
              </>
            ) : (
              <>
                <IconUpload className='h-4 w-4' /> 上传新简历
              </>
            )}
          </Button>
          <Button className='h-10 px-4 py-2' onClick={onSave} disabled={uploading}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}


