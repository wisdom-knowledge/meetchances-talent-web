import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { IconArrowRight } from '@tabler/icons-react'

interface AnnotateTestPendingProps {
  onTaskComplete: () => void
}

/**
 * 标注测试待完成视图
 * 引导用户前往 Xpert Studio 完成标注测试任务
 */
export function AnnotateTestPending({ onTaskComplete }: AnnotateTestPendingProps) {
  const handleSubmit = () => {
    // TODO: 实现提交审核逻辑
    toast.success('已提交审核')
    // TODO：调用接口查询试标任务状态的接口，如果任务状态为已完成，则调用 onTaskComplete 方法
    onTaskComplete()
  }

  return (
    <div className='flex-1 flex items-center justify-center min-h-[60vh]'>
      <div className='flex flex-col items-center space-y-6 max-w-[520px] px-6'>
        {/* Logo 区域 */}
        <div className='flex items-center gap-6'>
          <div>
            <img
              src='https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding.svg'
              alt='一面千识'
              className='h-[100px] w-auto object-contain'
            />
            <p className='text-sm py-2 text-center text-foreground leading-relaxed'>一面千识</p>
          </div>
          
          <IconArrowRight className='h-8 w-8 text-muted-foreground top-4' />
          <div>
            <img
              src='https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding-blue.svg'
              alt='Xpert Studio'
              className='h-[100px] w-auto object-contain'
            />
            <p className='text-sm py-2 text-center text-foreground leading-relaxed'>Xpert Studio</p>
          </div>

        </div>

        {/* 说明文字 */}
        <div className='text-center space-y-4'>
          <p className='text-lg text-foreground leading-relaxed'>
            请点击链接前往{' '}
            <a
              href='https://xpertstudio.com'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary underline font-medium'
            >
              Xpert Studio
            </a>
            ，使用一面千识的注册手机号短信登陆后，完成【项目名】下所有任务。确认完成后请点击下方按钮提交审核
          </p>
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          className='h-[44px] w-[200px] bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)] text-white'
        >
          我已完成任务，提交审核
        </Button>

      </div>
    </div>
  )
}

