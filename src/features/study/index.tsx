import { useQuery } from '@tanstack/react-query'
import studyVideo from '@/assets/study.mp4'
import { Button } from '@/components/ui/button'
import TitleBar from '@/components/title-bar'
import { useRuntimeEnv } from '@/hooks/use-runtime-env'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { fetchStudyModules, type StudyModuleItem } from './api'
import { StudyCard } from './components/study-card'

// 组件已抽离到 components/study-card.tsx

export default function StudyPage() {
  const env = useRuntimeEnv()
  const isMobile = env === 'mobile'
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const {
    data = [],
    isLoading,
  } = useQuery({
    queryKey: ['study-modules'],
    queryFn: fetchStudyModules,
  })

  const modules = data

  // 锁定规则：必须完成上一模块（status === 3）才可解锁下一模块
  function computeLocked(idx: number): boolean {
    if (idx === 0) return false
    const prev = modules[idx - 1]
    return !prev || prev.status !== 3
  }

  const list: Array<StudyModuleItem | null> = isLoading
    ? Array.from({ length: 4 }, () => null)
    : modules

  // 若所有模块均未开始，则将第一个模块以“进行中”样式展示（仅前端视觉）
  const allNotStarted = modules.length > 0 && modules.every((m) => m.status === 1)
  const displayModules = allNotStarted
    ? modules.map((m, idx) => (idx === 0 ? { ...m, status: 2 as 1 | 2 | 3 } : m))
    : modules

  // 按模块状态控制按钮文案与显隐
  const isAllDone = modules.length > 0 && modules.every((m) => m.status === 3)
  const isFirstNotStarted = (modules[0]?.status ?? 1) === 1
  const showActionButton = !isAllDone
  const firstTaskId = modules[0]?.tasks?.[0]?.task_id
  const inProgressModule = displayModules.find((m) => m.status === 2)
  const inProgressFirstTaskId = inProgressModule?.tasks?.[0]?.task_id
  const nextModuleIndex = isFirstNotStarted
    ? 0
    : (inProgressModule ? displayModules.findIndex((m) => m.id === inProgressModule.id) : -1)
  const actionLabel = nextModuleIndex === 0 ? '开始学习' : '进入下一模块'

  // 当访问 /study/task 时，仅渲染子路由页面（问卷页）
  if (pathname.startsWith('/study/task')) {
    return (
      <Main fixed>
        <Outlet />
      </Main>
    )
  }

  return (
    <Main fixed className='bg-[#FDFBFE] overflow-auto md:overflow-visible pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-0'>
      {isMobile && (
        <div className='w-full max-w-[1056px] mx-auto px-2 md:px-0'>
          <TitleBar title='流程学习' back />
        </div>
      )}
      <div className='flex w-full grow flex-col items-center justify-center'>
      {/* 第一行：左侧 Tip + 中间视频（保持原尺寸），整体垂直居中 */}
      <div className='w-full max-w-[1056px] mx-auto'>
      {/* 第一行：左侧 Tip + 中间视频（移动端竖排；桌面横排居中）；Tip 与卡片左边对齐 */}
      <div className='mb-[42px] flex flex-col md:flex-row items-center md:items-center justify-center md:justify-center gap-4 md:gap-6'>
        {/* 左侧 Tip（最大宽度 310） */}
        <div className='shrink-0 md:w-[310px] max-w-[310px] mx-auto'>
          <div className='relative inline-block w-full max-w-[310px] md:max-w-[310px] rounded-2xl border-2 border-dashed border-[#C994F7] bg-[#C994F733] px-4 py-3 text-sm leading-6 text-[#000000] shadow-none'>
            完成本教程为部分项目的前置要求，可以提前学习，加速申请流程哦！
          </div>
        </div>
        {/* 中间视频：整行居中 */}
        <div className='min-w-0 grow'>
          <div className='mx-auto h-[184px] w-[237px] overflow-hidden rounded-xl bg-transparent'>
            <video
              src={studyVideo}
              autoPlay
              muted
              loop
              playsInline
              className='pointer-events-none block h-full w-full select-none object-cover border-0 outline-none'
              aria-hidden='true'
              disablePictureInPicture
              controlsList='nodownload noplaybackrate nofullscreen'
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
        {/* 右侧占位，保持视频真正居中（与左侧 tip 等宽） */}
        <div className='hidden md:block shrink-0 w-[310px]' aria-hidden='true' />
      </div>

      {/* 第二行：步骤卡片容器宽度与上方保持一致，使左边对齐 */}
      <div className='mx-auto flex max-w-[1056px] flex-wrap justify-center gap-[28px]'>
        {(isLoading ? list : displayModules).map((m, idx) => {
          return isLoading || !m ? (
            <div key={idx} className='bg-muted h-[133px] w-[243px] animate-pulse rounded-xl' />
          ) : (
            <StudyCard key={idx} item={m} index={idx} locked={computeLocked(idx)} />
          )
        })}
      </div>
      </div>

      {/* 第三行：按钮，距离卡片 62px；全部完成则不显示 */}
      {showActionButton && (
        <div className='mt-[62px] flex justify-center'>
          <Link
            to='/study/task'
            search={{ id: isFirstNotStarted ? firstTaskId : inProgressFirstTaskId }}
            disabled={!isFirstNotStarted && !inProgressFirstTaskId}
          >
            <Button
              className='w-[346px] bg-[linear-gradient(89.99deg,_#4E02E4_9.53%,_#C994F7_99.99%)] shadow-[0_0_4px_#00000040] text-white hover:brightness-105'
            >
              {actionLabel}
            </Button>
          </Link>
        </div>
      )}
      </div>
    </Main>
  )
}
