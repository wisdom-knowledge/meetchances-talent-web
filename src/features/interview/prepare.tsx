import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import Lottie from 'lottie-react'
import voiceLottie from '@/lotties/voice-lottie.json'

export default function InterviewPreparePage() {
  const navigate = useNavigate()

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>面试准备</h1>
          <p className='text-muted-foreground'>开始面试前，请确认设备与环境已准备就绪。</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='grid h-[70vh] w-full grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='hidden lg:block' />

          <div className='flex items-center justify-center'>
            <div className='h-60 w-60'>
              <Lottie animationData={voiceLottie} loop={false} autoplay={false} className='h-full w-full' />
            </div>
          </div>

          <div className='flex flex-col justify-center px-2 lg:px-8'>
            <div className='max-w-md'>
              <h2 className='mb-6 text-xl font-medium'>开始面试前，请注意：</h2>
              <ol className='mb-8 space-y-4 text-sm leading-relaxed text-muted-foreground'>
                <li className='flex'>
                  <span className='mr-2 font-medium'>1.</span>
                  <span>本次 AI 面试会录制保存，完成后可在个人档案中回看。</span>
                </li>
                <li className='flex'>
                  <span className='mr-2 font-medium'>2.</span>
                  <span>面试过程受监考，请保持在本标签页内，不要使用外部工具。</span>
                </li>
                <li className='flex'>
                  <span className='mr-2 font-medium'>3.</span>
                  <span>如有疑问，请随时向面试官（AI）进行澄清。</span>
                </li>
              </ol>

              <Button size='lg' className='w-full font-mono' onClick={() => navigate({ to: '/interview/session' })}>
                开始面试
              </Button>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}


