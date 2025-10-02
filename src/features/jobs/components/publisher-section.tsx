import type { ApiJob } from '@/features/jobs/api'
import { useIsMobile } from '@/hooks/use-mobile'

export interface PublisherSectionProps {
  job: ApiJob
  recommendName?: string
}

const companyMaps = [
  {
    id: 1,
    name: '一面千识',
    logo: 'https://dnu-cdn.xpertiise.com/common/34af7d0c-7d83-421d-b8ed-8b636ac77bf3.png',
    website: 'meetchances.com'
  },
  {
    id: 2,
    name: '文心一言',
    logo: 'https://dnu-cdn.xpertiise.com/common/b151ae4c-81b0-46e4-aceb-1773c4cf5058.png',
    website: 'yiyan.baidu.com'
  }
]

// PC 端组件
function DesktopPublisherSection({ job, recommendName }: PublisherSectionProps) {
  const company = companyMaps.find((item) => item.id === job.company_id)
  return (
    <div>
      <div className='border-border flex items-center gap-3 border-b py-4'>
        <div className='flex h-9 w-9 items-center justify-center overflow-hidden bg-white'>
          <img
            src={company?.logo}
            alt={company?.name}
            className='h-9 w-9 object-contain ml-[3px] mt-[1px]'
          />
        </div>
        <div className='flex flex-col'>
          <span className='text-foreground text-sm font-medium'>
            由{company?.name}发布
          </span>
          <span className='text-muted-foreground mt-[10px] text-xs'>
            {company?.website}
          </span>
        </div>
      </div>
      {recommendName && (
        <div className='flex items-center bg-[#C994F760] pt-2 pr-[12px] pb-2 pl-[12px] text-white'>
          {`${recommendName}为您精选了此岗位，快来试试吧`}
        </div>
      )}
    </div>
  )
}

// 移动端组件
function MobilePublisherSection({ job, recommendName }: PublisherSectionProps) {
  const company = companyMaps.find((item) => item.id === job.company_id)
  return (
    <div>
      <div className='border-border flex items-center gap-3 border-b border-t py-3'>
        <div className='flex h-8 w-8 items-center justify-center overflow-hidden bg-white'>
          <img
            src={company?.logo}
            alt={company?.name}
            className='h-8 w-8 object-contain'
          />
        </div>
        <div className='flex flex-col'>
          <span className='text-foreground text-xs font-medium'>
            由{company?.name}发布
          </span>
          <span className='text-muted-foreground mt-1 text-xs'>
            {company?.website}
          </span>
        </div>
      </div>
      {recommendName && (
        <div className='flex items-center bg-[#C994F760] pt-2 pr-[12px] pb-2 pl-[12px] text-white'>
          {`${recommendName}为您精选了此岗位，快来试试吧`}
        </div>
      )}
    </div>
  )
}

export default function PublisherSection(props: PublisherSectionProps) {
  const isMobile = useIsMobile()

  return isMobile ? <MobilePublisherSection {...props} /> : <DesktopPublisherSection {...props} />
}


