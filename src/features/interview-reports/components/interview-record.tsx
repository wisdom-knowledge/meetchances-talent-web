import { useEffect, useRef, useState, useMemo } from 'react'
import { IconVideoOff } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { AiInterviewSection } from '../data/interview-report-types'

// 静态占位图（如需）
const posterImageUrl = ''
// 技能图标（使用打包友好的方式获取资源URL，避免类型问题）
const softSkillIconUrl = new URL('../images/soft-skill.svg', import.meta.url)
  .href
const otherSkillIconUrl = new URL('../images/other-skill.svg', import.meta.url)
  .href

interface Props {
  data?: AiInterviewSection
  videoUrl?: string
}

// 获取技能图标
const getSkillIcon = (skillType: string) => {
  const src = skillType === 'soft_skill' ? softSkillIconUrl : otherSkillIconUrl
  return <img src={src} alt='' className='h-5 w-5' />
}

// 技能等级标签与颜色（根据 soft_skill 与其他技能采用不同分段规则）
const getSkillLevel = (
  score: number,
  sectionName: string
): { text: string; className: string } => {
  const s = Math.max(0, Math.min(100, score))
  const isSoft = sectionName === 'soft_skill'

  if (isSoft) {
    // 软技能：[0,30) 差；[30,60) 一般；[60,80) 良好；[80,100] 优秀
    if (s < 30) return { text: '差', className: 'bg-[#FFDEDD] text-[#F4490B]' }
    if (s < 60)
      return { text: '一般', className: 'bg-[#FFF6BC] text-[#B28300]' }
    if (s < 80)
      return { text: '良好', className: 'bg-[#EEFCD7] text-[#71B00D]' }
    return { text: '优秀', className: 'bg-[#D7FCE3] text-[#00BD65]' }
  }

  // 其他技能：[0,20) 无经验；[20,40) 入门级；[40,60) 初级；[60,80) 熟练；[80,100] 精通
  if (s < 20)
    return { text: '无经验', className: 'bg-[#FFDEDD] text-[#F4490B]' }
  if (s < 40)
    return { text: '入门级', className: 'bg-[#FFF6BC] text-[#B28300]' }
  if (s < 60) return { text: '初级', className: 'bg-[#EEFCD7] text-[#71B00D]' }
  if (s < 80) return { text: '熟练', className: 'bg-[#C1FBC1] text-[#08A305]' }
  return { text: '精通', className: 'bg-[#A6FFC3] text-[#00944C]' }
}

// AI面试骨架屏组件
export function AiInterviewSkeleton() {
  return (
    <div className='space-y-6'>
      {/* 标题和节点评分骨架 */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>AI 面试</h2>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-500'>节点评分</span>
          <Skeleton className='h-4 w-4 rounded-full' />
          <Skeleton className='h-8 w-8 rounded' />
        </div>
      </div>

      {/* 技能评价概览骨架 */}
      <div className=''>
        <h3 className='mb-4 font-medium text-gray-900'>技能评价概览</h3>

        <div className='mb-6 grid grid-cols-2 gap-3'>
          {/* 四个技能卡片骨架 */}
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4'
            >
              <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-10 rounded-lg' />
                <div>
                  <Skeleton className='h-5 w-16' />
                </div>
              </div>
              <div className='flex items-center gap-1'>
                <Skeleton className='h-6 w-12 rounded-full' />
                <Skeleton className='h-4 w-4 rounded-full' />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 面试记录骨架 */}
      <div className=''>
        <h3 className='mb-4 font-medium text-gray-900'>面试记录</h3>

        <div className='rounded-lg border border-gray-300 bg-gray-50 p-4'>
          {/* 桌面端骨架 - 左右分栏 */}
          <div className='hidden md:grid h-[400px] grid-cols-2 gap-4'>
            {/* 左侧视频区域骨架 */}
            <div className='overflow-hidden rounded-lg border-2 border-gray-300 bg-white'>
              <Skeleton className='h-full w-full' />
            </div>

            {/* 右侧对话记录骨架 */}
            <div className='overflow-hidden rounded-lg border border-gray-200 bg-white p-4'>
              <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full overflow-y-auto'>
                <div className='space-y-0'>
                  {/* 模拟6条对话记录 - 匹配真实对话的结构和间距 */}
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx}>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-3 w-10' />
                        <Skeleton className='h-[26px] w-16 rounded-[12px]' />
                      </div>
                      <div className='ml-[50px] px-0 pt-3 pb-9'>
                        <Skeleton className='mb-2 h-4 w-full' />
                        <Skeleton className='mb-2 h-4 w-4/5' />
                        <Skeleton className='h-4 w-3/4' />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 移动端骨架 - 上下结构 */}
          <div className='md:hidden space-y-4'>
            {/* 上方视频区域骨架 */}
            <div className='h-[200px] overflow-hidden rounded-lg border-2 border-gray-300 bg-white'>
              <Skeleton className='h-full w-full' />
            </div>

            {/* 下方对话记录骨架 */}
            <div className='h-[300px] overflow-hidden rounded-lg border border-gray-200 bg-white p-4'>
              <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full overflow-y-auto'>
                <div className='space-y-0'>
                  {/* 模拟4条对话记录（移动端显示较少） */}
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx}>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-3 w-10' />
                        <Skeleton className='h-[26px] w-16 rounded-[12px]' />
                      </div>
                      <div className='ml-[50px] px-0 pt-3 pb-9'>
                        <Skeleton className='mb-2 h-4 w-full' />
                        <Skeleton className='mb-2 h-4 w-4/5' />
                        <Skeleton className='h-4 w-3/4' />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AiInterviewSection({ data, videoUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  const [posterSrc, setPosterSrc] = useState<string | undefined>(undefined)
  // 计算面试官+候选人一问一答为一组（面试官可>=1，候选人可为0）
  const groups = useMemo(() => {
    const items = data?.detail_text ?? []
    const result: Array<{ items: typeof items; tSec?: number }> = []
    let i = 0
    while (i < items.length) {
      const segment: typeof items = []
      // 收集连续的面试官
      while (i < items.length && items[i].role === 'assistant') {
        segment.push(items[i])
        i++
      }
      // 收集连续的候选人
      while (i < items.length && items[i].role !== 'assistant') {
        segment.push(items[i])
        i++
      }
      if (segment.length > 0) {
        const tSec = segment.find(
          (m) => m.role === 'assistant' && typeof m.metadata?.t_sec === 'number'
        )?.metadata?.t_sec
        result.push({ items: segment, tSec })
      }
    }
    return result
  }, [data?.detail_text])

  function handleJumpTo(second: number | undefined, idx: number) {
    if (typeof second === 'number' && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, second)
      // 可选：自动播放
      // void videoRef.current.play?.()
    }
    setActiveIdx(idx)
    setTimeout(() => setActiveIdx(null), 600)

    const container = chatRef.current
    const el = itemRefs.current[idx]
    if (container && el) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const currentTop = container.scrollTop
      const delta = elRect.top - containerRect.top
      const targetTop =
        currentTop + delta - (container.clientHeight / 2 - el.clientHeight / 2)
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    }
  }

  // 使用隐藏视频截帧获取指定秒的封面，而不改变可见播放器 currentTime（需视频源 CORS）
  useEffect(() => {
    if (!videoUrl) return

    let hidden: HTMLVideoElement | null = document.createElement('video')
    hidden.preload = 'metadata'
    hidden.crossOrigin = 'anonymous'
    hidden.muted = true
    hidden.src = videoUrl
    hidden.playsInline = true
    // 放到视口外，避免影响布局
    hidden.style.position = 'fixed'
    hidden.style.left = '-10000px'
    hidden.style.top = '0'
    hidden.style.width = '1px'
    hidden.style.height = '1px'
    hidden.style.opacity = '0'
    document.body.appendChild(hidden)

    const cleanup = () => {
      if (hidden) {
        if (!hidden.paused) {
          try {
            hidden.pause()
          } catch {
            /* noop */
          }
        }
        hidden.removeAttribute('src')
        hidden.load()
        if (hidden.parentNode) {
          try {
            hidden.parentNode.removeChild(hidden)
          } catch {
            /* noop */
          }
        }
        hidden = null
      }
    }

    const capture = () => {
      if (!hidden || !hidden.videoWidth || !hidden.videoHeight) return
      const canvas = document.createElement('canvas')
      canvas.width = hidden.videoWidth
      canvas.height = hidden.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      try {
        ctx.drawImage(hidden, 0, 0, canvas.width, canvas.height)
        const url = canvas.toDataURL('image/png')
        setPosterSrc(url)
      } catch (_e) {
        // ignore
      } finally {
        cleanup()
      }
    }

    const onLoadedMetadata = () => {
      if (!hidden) return
      const onSeeked = () => {
        capture()
        hidden?.removeEventListener('seeked', onSeeked)
      }
      hidden.addEventListener('seeked', onSeeked)
      try {
        hidden.currentTime = 3
      } catch {
        capture()
      }
    }

    hidden.addEventListener('loadedmetadata', onLoadedMetadata)
    hidden.addEventListener('error', cleanup)

    return cleanup
  }, [videoUrl])
  // 判空处理
  if (!data) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>AI 面试</h2>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-500'>节点评分</span>
            <div className='text-xl font-bold text-green-600'>--</div>
          </div>
        </div>
        <div className='py-8 text-center text-gray-500'>暂无 AI 面试数据</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* 标题和节点评分 */}

      {/* 能力分析与建议 */}
      <div>
        <div className='mb-4 flex items-center gap-2'>
          <h3 className='font-medium text-gray-900'>能力分析与建议</h3>
        </div>

        {Array.isArray(data.talent_interview_evaluation) &&
        data.talent_interview_evaluation.length > 0 ? (
          data.talent_interview_evaluation.map((s, idx) => {
            const score = s.score_item?.score ?? 0
            const feedbacks = s.score_item?.feedback_for_user ?? []
            const level = getSkillLevel(score, s.section_name)
            const skillName =
              s.section_name === 'soft_skill' ? '软技能' : s.section_name

            return (
              <div
                key={idx}
                className='mb-6 rounded-lg border border-gray-200 bg-white p-4'
              >
                {/* 技能标题行 */}
                <div className='mb-4 flex items-center'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                      {getSkillIcon(s.section_name)}
                    </div>
                    <div className='mr-[10px] font-medium text-gray-900'>
                      {skillName}
                    </div>
                  </div>
                  <span
                    className={`inline-flex w-[53px] justify-center rounded-[8px] py-1 text-[12px] font-medium ${level.className}`}
                  >
                    {level.text}
                  </span>
                </div>

                {/* 千识点评 - 平铺展示 */}
                {Array.isArray(feedbacks) && feedbacks.length > 0 && (
                  <div className='rounded-lg border border-gray-100 bg-gray-50 p-4'>
                    <h4 className='mb-3 text-sm font-medium text-gray-900'>
                      千识点评
                    </h4>
                    <ul className='space-y-2'>
                      {feedbacks.map((f, i) => (
                        <li
                          key={i}
                          className='flex items-start gap-2 text-sm text-gray-600'
                        >
                          <span className='mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400'></span>
                          <span className='leading-relaxed whitespace-pre-wrap'>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 提升建议 */}
                <div className='mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4'>
                  <h4 className='mb-3 text-sm font-medium text-gray-900'>
                    提升建议
                  </h4>
                  {Array.isArray(s.score_item?.suggestions_for_user) && s.score_item!.suggestions_for_user!.length > 0 ? (
                    <ul className='space-y-2'>
                      {s.score_item!.suggestions_for_user!.map((sg, i) => (
                        <li key={i} className='flex items-start gap-2 text-sm text-gray-600'>
                          <span className='mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400'></span>
                          <span className='leading-relaxed whitespace-pre-wrap'>
                            {sg}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className='text-sm text-gray-500'>暂无提升建议</div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className='py-8 text-center text-gray-500'>暂无技能数据</div>
        )}
      </div>

      {/* 面试记录 */}
      <div className=''>
        <h3 className='mb-4 font-medium text-gray-900'>面试记录</h3>

        <div className='rounded-lg border border-gray-300 bg-gray-50 p-4'>
          {/* 桌面端 - 左右分栏 */}
          <div className='hidden md:grid h-[400px] grid-cols-2 gap-4'>
            {/* 左侧视频区域 */}
            <div className='overflow-hidden rounded-lg border-2 border-gray-300 bg-white'>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  className='h-full w-full object-cover'
                  controls
                  preload='metadata'
                  crossOrigin='anonymous'
                  poster={posterSrc ?? posterImageUrl}
                >
                  <source src={videoUrl} type='video/mp4' />
                  您的浏览器不支持视频播放
                </video>
              ) : (
                <div className='flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6 text-center'>
                  <div className='rounded-full bg-gray-100 p-3 shadow-sm'>
                    <IconVideoOff className='h-8 w-8 text-gray-400' />
                  </div>
                  <div className='mt-3 text-base font-medium text-gray-700'>
                    暂无视频
                  </div>
                  <div className='mt-1 text-xs text-gray-500'>
                    请等待视频生成或处理完成后再试
                  </div>
                </div>
              )}
            </div>

            {/* 右侧对话记录（detail_text） */}
            <div className='overflow-hidden rounded-lg border border-gray-200 bg-white p-4'>
              <div
                ref={chatRef}
                className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full overflow-y-auto'
              >
                <div className='space-y-2'>
                  {groups.length > 0 ? (
                    groups.map((g, gIdx) => (
                      <div
                        key={gIdx}
                        ref={(el) => {
                          itemRefs.current[gIdx] = el
                        }}
                        onClick={() => handleJumpTo(g.tSec, gIdx)}
                        className={`relative cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-gray-50 ${
                          activeIdx === gIdx
                            ? 'z-10 animate-pulse ring-2 ring-[#4E02E4] ring-inset'
                            : ''
                        }`}
                        role='button'
                        tabIndex={0}
                      >
                        {g.items.map((d, idx) => {
                          const tSec = d.metadata?.t_sec
                          const isAssistant = d.role === 'assistant'
                          return (
                            <div key={idx}>
                              <div className='flex items-center gap-2'>
                                <span className='cursor-pointer text-xs font-medium text-[#4E02E4]'>
                                  {typeof tSec === 'number'
                                    ? `${String(Math.floor(tSec / 60)).padStart(2, '0')}:${String(Math.floor(tSec % 60)).padStart(2, '0')}`
                                    : ''}
                                </span>
                                <span
                                  className={`h-[26px] rounded-[12px] px-[12px] text-xs leading-[26px] ${
                                    d.role === 'assistant'
                                      ? 'bg-[#F6F2FD] text-[#4E02E4]'
                                      : 'bg-[#4E02E4] text-white'
                                  }`}
                                >
                                  {' '}
                                  {isAssistant ? '面试官' : '候选人'}
                                </span>
                              </div>
                              <div
                                className={`ml-[50px] px-0 pt-3 pb-3 text-sm leading-[1.6] ${
                                  isAssistant ? 'font-bold' : ''
                                } tracking-[0.35px] break-all whitespace-pre-wrap text-black/50`}
                              >
                                {d.content}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  ) : (
                    <div className='py-8 text-center text-gray-500'>
                      暂无对话记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 移动端 - 上下结构 */}
          <div className='md:hidden space-y-4'>
            {/* 上方视频区域 */}
            <div className='h-[200px] overflow-hidden rounded-lg border-2 border-gray-300 bg-white'>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  className='h-full w-full object-cover'
                  controls
                  preload='metadata'
                  crossOrigin='anonymous'
                  poster={posterSrc ?? posterImageUrl}
                >
                  <source src={videoUrl} type='video/mp4' />
                  您的浏览器不支持视频播放
                </video>
              ) : (
                <div className='flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6 text-center'>
                  <div className='rounded-full bg-gray-100 p-3 shadow-sm'>
                    <IconVideoOff className='h-8 w-8 text-gray-400' />
                  </div>
                  <div className='mt-3 text-base font-medium text-gray-700'>
                    暂无视频
                  </div>
                  <div className='mt-1 text-xs text-gray-500'>
                    请等待视频生成或处理完成后再试
                  </div>
                </div>
              )}
            </div>

            {/* 下方对话记录 */}
            <div className='h-[300px] overflow-hidden rounded-lg border border-gray-200 bg-white p-4'>
              <div
                ref={chatRef}
                className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full overflow-y-auto'
              >
                <div className='space-y-2'>
                  {groups.length > 0 ? (
                    groups.map((g, gIdx) => (
                      <div
                        key={gIdx}
                        ref={(el) => {
                          itemRefs.current[gIdx] = el
                        }}
                        onClick={() => handleJumpTo(g.tSec, gIdx)}
                        className={`relative cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-gray-50 ${
                          activeIdx === gIdx
                            ? 'z-10 animate-pulse ring-2 ring-[#4E02E4] ring-inset'
                            : ''
                        }`}
                        role='button'
                        tabIndex={0}
                      >
                        {g.items.map((d, idx) => {
                          const tSec = d.metadata?.t_sec
                          const isAssistant = d.role === 'assistant'
                          return (
                            <div key={idx}>
                              <div className='flex items-center gap-2'>
                                <span className='cursor-pointer text-xs font-medium text-[#4E02E4]'>
                                  {typeof tSec === 'number'
                                    ? `${String(Math.floor(tSec / 60)).padStart(2, '0')}:${String(Math.floor(tSec % 60)).padStart(2, '0')}`
                                    : ''}
                                </span>
                                <span
                                  className={`h-[26px] rounded-[12px] px-[12px] text-xs leading-[26px] ${
                                    d.role === 'assistant'
                                      ? 'bg-[#F6F2FD] text-[#4E02E4]'
                                      : 'bg-[#4E02E4] text-white'
                                  }`}
                                >
                                  {' '}
                                  {isAssistant ? '面试官' : '候选人'}
                                </span>
                              </div>
                              <div
                                className={`ml-[50px] px-0 pt-3 pb-3 text-sm leading-[1.6] ${
                                  isAssistant ? 'font-bold' : ''
                                } tracking-[0.35px] break-all whitespace-pre-wrap text-black/50`}
                              >
                                {d.content}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  ) : (
                    <div className='py-8 text-center text-gray-500'>
                      暂无对话记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
