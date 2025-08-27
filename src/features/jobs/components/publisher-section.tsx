export interface PublisherSectionProps {
  recommendName?: string
}

export default function PublisherSection({ recommendName }: PublisherSectionProps) {
  return (
    <div>
      <div className='border-border flex items-center gap-3 border-b py-4'>
        <div className='flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-white'>
          <img
            src={'https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding.svg'}
            alt='meetchances'
            className='h-7 w-7 object-contain'
          />
        </div>
        <div className='flex flex-col'>
          <span className='text-foreground text-sm font-medium'>
            由一面千识发布
          </span>
          <span className='text-muted-foreground mt-[10px] text-xs'>
            meetchances.com
          </span>
        </div>
      </div>
      {recommendName && (
        <div className='flex items-center bg-[#C994F760] pt-2 pr-[12px] pb-2 pl-[12px] text-white'>{`${recommendName}为您精选了此岗位，快来试试吧`}</div>
      )}
    </div>
  )
}


