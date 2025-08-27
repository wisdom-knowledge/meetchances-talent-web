import { cn } from '@/lib/utils'

export interface MobileFullscreenMaskProps {
  open: boolean
  onClose?: () => void
  className?: string
}

export function MobileFullscreenMask({
  open,
  onClose,
  className,
}: MobileFullscreenMaskProps) {
  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-[60] transition-opacity duration-300 ease-out',
        open
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0',
        className
      )}
      onClick={onClose}
    >
      {/* 背景层 */}
      <div className='absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_67.36%,#DFBFFA_96.86%)]' />

      <div className='relative flex h-full w-full flex-col items-center justify-center px-6 text-center text-white'>
        <img
          src={
            'https://dnu-cdn.xpertiise.com/common/942a2fdb-7d92-41a6-aff0-570ad59e6d31.svg'
          }
          alt='meetchances'
          className='mb-10 h-[52px] w-[144px]'
        />
        <p className='max-w-xs text-sm text-black'>
          为确保您有一个良好的体验，
        </p>
        <p className='max-w-xs text-sm text-black'>请在桌面端打开链接</p>
      </div>
    </div>
  )
}

export default MobileFullscreenMask
