import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearch, useRouter } from '@tanstack/react-router'
import { IconLoader2 } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchStudyModules, type StudyModulesResponse, updateStudyStatus } from './api'

function findTask(modules: StudyModulesResponse, taskId: number) {
  for (const m of modules) {
    const idx = m.tasks.findIndex((t) => Number(t.task_id) === taskId)
    if (idx >= 0) return { module: m, task: m.tasks[idx], index: idx }
  }
  return null
}

export default function StudyTaskPage() {
  const router = useRouter()
  const { id } = useSearch({ from: '/_authenticated/study/task' }) as {
    id?: number | string
  }
  const idNum = Number(id)
  const { data: modules = [] } = useQuery({
    queryKey: ['study-modules'],
    queryFn: fetchStudyModules,
  })
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const found = findTask(modules, idNum)
  const link = found?.task?.link ?? ''
  const isLast = found ? found.index === found.module.tasks.length - 1 : true
  const nextTaskId =
    found && !isLast ? found.module.tasks[found.index + 1]?.task_id : undefined
  const isFirst = found ? found.index === 0 : true

  // 进入任务页：若所属模块为未开始(1)，自动标记为进行中(2)
  const inProgressUpdatedRef = useRef<number | null>(null)
  useEffect(() => {
    const modId = found?.module?.id
    const modStatus = found?.module?.status
    if (!modId) return
    if (modStatus !== 1) return
    if (inProgressUpdatedRef.current === modId) return
    inProgressUpdatedRef.current = modId
    ;(async () => {
      try {
        await updateStudyStatus({ id: Number(modId), status: 2 })
        // 列表失效，便于返回时获取最新状态
        queryClient.invalidateQueries({ queryKey: ['study-modules'] })
      } catch {
        // ignore
      }
    })()
  }, [found?.module?.id, found?.module?.status, queryClient])

  const handleFinish = async () => {
    if (isLoading) return
    setIsLoading(true)
    setHasError(false)
    try {
      if (found?.module?.id) {
        // 若模块已完成则不再调用更新接口
        if (found.module.status !== 3) {
          const result = await updateStudyStatus({ id: Number(found.module.id), status: 3 })
          if (!result) throw new Error()
        }
        toast.success('已完成该模块')
        queryClient.invalidateQueries({ queryKey: ['study-modules'] })
        // router.navigate({ to: '/study' })
      }
    } catch (_error) {
      toast.error('更新学习状态失败')
    }
  }

  const handleNext = () => {
    if (isLoading || nextTaskId === undefined) return
    setIsLoading(true)
    setHasError(false)
    router.navigate({ to: '/study/task', search: { id: nextTaskId } })
  }

  const handlePrev = () => {
    if (isFirst || isLoading || !found) return
    const prevTaskId = found.module.tasks[found.index - 1]?.task_id
    if (prevTaskId === undefined) return
    setIsLoading(true)
    setHasError(false)
    router.navigate({ to: '/study/task', search: { id: prevTaskId }, replace: true })
  }

  return (
    <div className='p-4 pb-[calc(env(safe-area-inset-bottom)+100px)] md:pb-8 flex min-h-screen flex-col gap-6'>
      <div className='md:mb-4 flex items-center justify-between'>
        {isFirst ? (
          <span />
        ) : (
          <Button variant='secondary' onClick={handlePrev} disabled={isLoading}>
            返回上一章节
          </Button>
        )}
        {/* <Button variant='ghost' onClick={() => router.navigate({ to: '/study' })}>
          返回流程学习
        </Button> */}
      </div>

      <div className='bg-white p-0 rounded-xl shadow-sm flex flex-1 flex-col min-h-0'>
        {link ? (
          <div className='relative flex-1 w-full min-h-0'>
            {isLoading && (
              <div className='bg-background absolute inset-0 z-10 flex flex-col items-center justify-center'>
                <IconLoader2 className='text-primary mb-4 h-8 w-8 animate-spin' />
                <p className='text-muted-foreground text-sm'>加载中...</p>
                <div className='mt-8 w-full max-w-2xl space-y-4 px-8'>
                  <Skeleton className='h-8 w-3/4' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-5/6' />
                  <div className='space-y-2 pt-4'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                  <Skeleton className='h-12 w-32' />
                </div>
              </div>
            )}

            {hasError && (
              <div className='bg-background absolute inset-0 z-10 flex flex-col items-center justify-center'>
                <div className='max-w-md space-y-4 text-center'>
                  <p className='text-destructive text-lg'>问卷加载失败</p>
                  <p className='text-muted-foreground text-sm'>
                    请检查网络连接或稍后重试
                  </p>
                  <Button
                    onClick={() => {
                      setIsLoading(true)
                      setHasError(false)
                      const iframe = document.getElementById(
                        'study-iframe'
                      ) as HTMLIFrameElement | null
                      if (iframe) {
                        const url = new URL(iframe.src, window.location.href)
                        url.searchParams.set('ts', String(Date.now()))
                        iframe.src = url.toString()
                      }
                    }}
                  >
                    重新加载
                  </Button>
                </div>
              </div>
            )}

            <iframe
              id='study-iframe'
              style={{ width: '100%', height: '100%', border: 'none' }}
              src={link}
              title='学习问卷'
              onLoad={() => {
                setIsLoading(false)
                setHasError(false)
              }}
              onError={() => {
                setIsLoading(false)
                setHasError(true)
              }}
              className={
                isLoading
                  ? 'opacity-0'
                  : 'opacity-100 transition-opacity duration-300'
              }
            />
          </div>
        ) : (
          <div className='text-muted-foreground p-6 text-center'>
            未找到任务或链接
          </div>
        )}
      </div>

      <div className='flex justify-center'>
        <Button
          disabled={isLoading || (!isLast && nextTaskId === undefined)}
          onClick={isLast ? handleFinish : handleNext}
          className='w-[346px] bg-[linear-gradient(89.99deg,_#4E02E4_9.53%,_#C994F7_99.99%)] text-white shadow-[0_0_4px_#00000040]'
        >
          {isLast ? '完成' : '下一步'}
        </Button>
      </div>
    </div>
  )
}
