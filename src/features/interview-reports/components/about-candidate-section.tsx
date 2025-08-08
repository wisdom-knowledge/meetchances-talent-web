import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { IconDownload } from '@tabler/icons-react'

interface AboutCandidateData {
  name: string
  description: string
  resumeUrl: string
  resumeFilename: string
}

interface AboutCandidateSectionProps {
  data: AboutCandidateData
}

export default function AboutCandidateSection({ data }: AboutCandidateSectionProps) {
  const handleDownloadResume = () => {
    // 创建一个临时链接来下载简历
    const link = document.createElement('a')
    link.href = data.resumeUrl
    link.download = data.resumeFilename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='mb-8'>
      <Separator className='my-4 lg:my-6' />
      
      <div className='space-y-6'>
        {/* 标题 */}
        <h2 className='text-xl font-semibold text-gray-900'>
          关于 {data.name}
        </h2>
        
        {/* 描述内容 */}
        <div className='prose prose-gray max-w-none'>
          <p className='text-sm text-gray-700 leading-relaxed'>
            {data.description}
          </p>
        </div>
        
        {/* 下载简历按钮 */}
        <div className='flex items-center gap-2'>
          <Button 
            variant='outline' 
            size='sm'
            onClick={handleDownloadResume}
            className='text-blue-600 border-blue-200 hover:bg-blue-50'
          >
            <IconDownload size={16} className='mr-2' />
            {data.resumeFilename}
          </Button>
        </div>
      </div>
    </div>
  )
}
