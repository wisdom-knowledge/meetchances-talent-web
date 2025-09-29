import { Button } from '@/components/ui/button'
import noApplySvg from '@/assets/images/no-apply.svg'

export default function MockEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className='flex flex-1 items-center justify-center overflow-y-auto'>
      <div className='text-muted-foreground flex flex-col items-center text-sm'>
        <img src={noApplySvg} alt='empty' className='mb-3 h-16 w-16 opacity-70' />
        <div className='mb-2'>暂无内容</div>
        {onReset && (
          <Button variant='outline' size='sm' onClick={onReset}>
            清空筛选
          </Button>
        )}
      </div>
    </div>
  )
}


