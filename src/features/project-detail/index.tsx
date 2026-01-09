import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

import {
  IconArrowLeft,
  IconInfoCircle,
  IconBulb,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import { bindDataAgreement, useProjectDetail, useProjectStats, useTalentAuthURL } from './api'
import { FeishuDocViewer } from './components/feishu-doc-viewer'
import titleIcon from './images/title.png'
import feishuIcon from './images/feishu.png'
import dataIcon from './images/data.png'
import payIcon from './images/pay.png'
import starIcon from '@/assets/images/star.svg'
import totalGetIcon from '@/assets/images/total-get.svg'
import rateIcon from '@/assets/images/rate.svg'
import finishProjectPng from '@/assets/images/finish-project.png'
import { Main } from '@/components/layout/main'

interface ScoreRow {
  label: string
  count: number
  isPositive: boolean
}

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { project_id?: number }
  const projectId = search.project_id ?? 1
  
  // 用于检查组件是否已挂载的 ref
  const isMountedRef = useRef(true)
  
  // 状态管理
  const [helpOpen, setHelpOpen] = useState(false)
  const [feishuDialogOpen, setFeishuDialogOpen] = useState(false)
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false)
  const [submitting] = useState(false)
  const [scoreLineTipOpen, setScoreLineTipOpen] = useState(false)
  const [trialGroupDialogOpen, setTrialGroupDialogOpen] = useState(false)

  // 数据获取
  const { data: projectData, isLoading: projectLoading, refetch: refetchProjectDetail } = useProjectDetail(projectId)
  const { data: feishuAuth, isLoading: authLoading } = useTalentAuthURL(feishuDialogOpen)
  
  // 需求开关：来自 project
  const requireFeishu = Boolean(projectData?.project?.require_feishu_binding)
  const requireAgreement = Boolean(projectData?.project?.require_data_agreement)
  const requirePayment = Boolean(projectData?.project?.require_payment_binding)

  // 支付绑定状态来自项目详情的 personal_info
  const isPaymentBound = Boolean(projectData?.personal_info?.miniprogram_openid)

  // 三个绑定状态（实际值从 API 获取，这里用 isPaymentBound 作为支付绑定状态）
  const isFeishuBound = Boolean(projectData?.personal_info?.has_feishu)
  const isAgreementBound = Boolean(projectData?.personal_info?.has_read_agreement)

  // 是否所有绑定都完成
  const allBound = useMemo(() => {
    const okFeishu = requireFeishu ? isFeishuBound : true
    const okAgreement = requireAgreement ? isAgreementBound : true
    const okPayment = requirePayment ? isPaymentBound : true
    return okFeishu && okAgreement && okPayment
  }, [requireFeishu, requireAgreement, requirePayment, isFeishuBound, isAgreementBound, isPaymentBound])

  // localStorage 工具函数：获取试标群链接存储数据
  const getTrialGroupLinks = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem('trial_group_links')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  // localStorage 工具函数：保存试标群链接
  const saveTrialGroupLink = (projectId: number, link: string) => {
    const links = getTrialGroupLinks()
    links[projectId.toString()] = link
    localStorage.setItem('trial_group_links', JSON.stringify(links))
  }

  // 检查是否需要弹出引导弹窗（第一次访问或 URL 变化）
  useEffect(() => {
    if (!projectData?.project?.trial_group_url) return
    
    const links = getTrialGroupLinks()
    const cachedLink = links[projectId.toString()]
    const currentLink = projectData.project.trial_group_url
    
    // 如果缓存中没有，或者缓存的链接与当前接口返回的链接不同，则弹出弹窗
    if (!cachedLink || cachedLink !== currentLink) {
      setTrialGroupDialogOpen(true)
    }
  }, [projectData?.project?.trial_group_url, projectId])

  // 组件卸载时清理
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])


  // 返回上一页
  const handleBack = () => {
    window.history.back()
  }

  // 飞书绑定
  const handleFeishuBind = () => {
    if (isFeishuBound) return // 已绑定则不弹窗
    setFeishuDialogOpen(true)
  }

  const confirmFeishuBind = async () => {
    // 这里需要调用飞书绑定 API，暂时模拟成功
    await refetchProjectDetail()
    setFeishuDialogOpen(false)
    toast.success('飞书绑定状态已刷新')
  }

  // 数据协议绑定
  const handleAgreementBind = () => {
    if (isAgreementBound) return // 已绑定则不弹窗
    setAgreementDialogOpen(true)
  }

  const confirmAgreementBind = async () => {
    try {
      await bindDataAgreement(projectId)
      await refetchProjectDetail()
      setAgreementDialogOpen(false)
      toast.success('已同意数据与工作协议')
    } catch (_error) {
      toast.error('绑定失败，请稍后重试')
    }
  }

  // 支付绑定 - 跳转到钱包页面
  const handlePaymentBind = () => {
    if (isPaymentBound) return // 已绑定则不跳转
    navigate({ to: '/wallet' })
    // 在钱包页面会自动弹起绑定弹窗（需要在 wallet 页面添加相关逻辑）
    // 可以通过 URL 参数传递信息，让钱包页面自动打开绑定弹窗
  }

  // 试标群弹窗：确认加入
  const handleTrialGroupConfirm = () => {
    const link = projectData?.project?.trial_group_url
    if (link) {
      saveTrialGroupLink(projectId, link)
      // 新开窗口打开试标群链接
      window.open(link, '_blank', 'noopener,noreferrer')
    }
    setTrialGroupDialogOpen(false)
  }

  // 试标群弹窗：关闭
  const handleTrialGroupClose = () => {
    const link = projectData?.project?.trial_group_url
    if (link) {
      saveTrialGroupLink(projectId, link)
    }
    setTrialGroupDialogOpen(false)
  }

  // 获取当前项目的试标群链接
  const trialGroupLink = projectData?.project?.trial_group_url
  const trialGroupLinks = getTrialGroupLinks()
  const currentTrialGroupLink = trialGroupLink || trialGroupLinks[projectId.toString()]

  // 提交项目
  const handleSubmit = async () => {
    if (!allBound) {
      toast.error('请先完成所有绑定')
      return
    }

    const url = projectData?.project?.questionnaire_url
    if (!url) {
      toast.error('暂无问卷地址，请稍后重试')
      return
    }
    // 打开问卷地址（新窗口/新标签页）
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // 报酬类型文案（基于 unit：1->小时；其他->按条）
  const unit = projectData?.project?.unit
  const paymentTypeLabel = unit === 0 ? '按小时计费' : '按条计费'
  const paymentUnit = unit === 0 ? '小时' : '审核通过条目'
  const hasWorkGuide = Boolean(projectData?.project?.work_guide)
  const isProjectEnded = projectData?.project?.status === 1
  const { data: projectStats, isLoading: projectStatsLoading } = useProjectStats(projectId, Boolean(projectId))

  // average_score => 项目综合评分
  const averageScore = projectStats?.average_score ?? 0
  // approved_amount => 此项目至今已赚
  const earnedAmount = projectStats?.approved_amount ?? 0
  const firstReviewPassRate = projectStats?.first_review_pass_rate ?? 0

  // score_distribution：数组 6 个元素分别对应 1/2/2.5/3/4/5 分的数量
  const scoreDistribution = useMemo<ScoreRow[]>(() => {
    const arr = Array.isArray(projectStats?.score_distribution)
      ? projectStats!.score_distribution
      : []
    const c1 = typeof arr[0] === 'number' ? arr[0] : 0
    const c2 = typeof arr[1] === 'number' ? arr[1] : 0
    const c25 = typeof arr[2] === 'number' ? arr[2] : 0
    const c3 = typeof arr[3] === 'number' ? arr[3] : 0
    const c4 = typeof arr[4] === 'number' ? arr[4] : 0
    const c5 = typeof arr[5] === 'number' ? arr[5] : 0

    return [
      { label: '5.0', count: c5, isPositive: true },
      { label: '4.0', count: c4, isPositive: true },
      { label: '3.0', count: c3, isPositive: true },
      // 2.5 警戒线
      { label: '2.5', count: c25, isPositive: false },
      { label: '2.0', count: c2, isPositive: false },
      { label: '1.0', count: c1, isPositive: false },
    ]
  }, [projectStats])

  // 进度条最大值：score_distribution 的数量之和
  const totalScoreCount = scoreDistribution.reduce((sum: number, r: ScoreRow) => sum + r.count, 0)
  const avgScorePillClass =
    averageScore >= 2.5 ? 'bg-[#4E02E480] text-white' : 'bg-[#FFDEDD] text-[#F4490B]'

  // 绑定状态卡片区域
  const bindingCardsSection = (requireFeishu || requireAgreement || requirePayment) && (
    <div className='flex flex-col gap-4'>
      <h2 className='text-base font-semibold tracking-[0.32px]'>请先完成流程</h2>
      <div className='flex flex-wrap gap-4'>
        {/* 飞书绑定 */}
        {requireFeishu && (
          <button
            onClick={handleFeishuBind}
            className='flex flex-1 min-w-[200px] items-center justify-center rounded-xl border border-primary/20 p-4 transition-all duration-200 cursor-pointer hover:border-primary hover:bg-[linear-gradient(90deg,rgba(78,2,228,0.05)_0%,rgba(78,2,228,0.05)_100%)] hover:shadow-sm hover:scale-[1.01]'
          >
            <div className='flex flex-1 items-center justify-between'>
              <div className='flex items-center gap-3'>
                <img src={feishuIcon} alt='飞书' className='h-6 w-6' />
                <span className='text-sm font-semibold'>飞书绑定</span>
              </div>
              {isFeishuBound ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <g clipPath="url(#clip0_8048_4957)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8ZM7.54347 11.424L12.1493 5.66613L11.3173 5.00053L7.38987 9.90827L4.608 7.5904L3.92533 8.4096L7.54347 11.424Z" fill="#4E02E4"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_8048_4957">
                      <rect width="16" height="16" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              ) : (
                <span className='text-xs font-medium text-primary underline decoration-solid'>待绑定</span>
              )}
            </div>
          </button>
        )}

        {/* 数据与工作协议 */}
        {requireAgreement && (
          <button
            onClick={handleAgreementBind}
            className='flex flex-1 min-w-[200px] items-center justify-center rounded-xl border border-primary/20 p-4 transition-all duration-200 cursor-pointer hover:border-primary hover:bg-[linear-gradient(90deg,rgba(78,2,228,0.05)_0%,rgba(78,2,228,0.05)_100%)] hover:shadow-sm hover:scale-[1.01]'
          >
            <div className='flex flex-1 items-center justify-between'>
              <div className='flex items-center gap-3'>
                <img src={dataIcon} alt='数据协议' className='h-6 w-6' />
                <span className='text-sm font-semibold'>数据与工作协议</span>
              </div>
              {isAgreementBound ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <g clipPath="url(#clip0_8048_4958)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8ZM7.54347 11.424L12.1493 5.66613L11.3173 5.00053L7.38987 9.90827L4.608 7.5904L3.92533 8.4096L7.54347 11.424Z" fill="#4E02E4"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_8048_4958">
                      <rect width="16" height="16" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              ) : (
                <span className='text-xs font-medium text-primary underline decoration-solid'>待确认</span>
              )}
            </div>
          </button>
        )}

        {/* 支付绑定 */}
        {requirePayment && (
          <button
            onClick={handlePaymentBind}
            className='flex flex-1 min-w-[200px] items-center justify-center rounded-xl border border-primary/20 p-4 transition-all duration-200 cursor-pointer hover:border-primary hover:bg-[linear-gradient(90deg,rgba(78,2,228,0.05)_0%,rgba(78,2,228,0.05)_100%)] hover:shadow-sm hover:scale-[1.01]'
          >
            <div className='flex flex-1 items-center justify-between'>
              <div className='flex items-center gap-3'>
                <img src={payIcon} alt='支付绑定' className='h-6 w-6' />
                <span className='text-sm font-semibold'>支付绑定</span>
              </div>
              {isPaymentBound ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <g clipPath="url(#clip0_8048_4959)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8ZM7.54347 11.424L12.1493 5.66613L11.3173 5.00053L7.38987 9.90827L4.608 7.5904L3.92533 8.4096L7.54347 11.424Z" fill="#4E02E4"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_8048_4959">
                      <rect width="16" height="16" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              ) : (
                <span className='text-xs font-medium text-primary underline decoration-solid'>待绑定</span>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  )

  const jobProjectRelationshipCard = (
    <Card className='w-full shrink-0 rounded-xl border border-primary/10 bg-[rgb(245,244,253)] p-6'>
      <div className='grid grid-cols-[24px_1fr] gap-x-3 gap-y-3'>
        <div className='mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10'>
          <IconBulb className='h-4 w-4 text-primary' />
        </div>

        <div className='text-base font-semibold text-black'>理解岗位与项目的关系</div>

        <ul className='col-span-2 list-inside list-disc space-y-2 text-sm leading-6 text-[#8569CB]'>
          <li>岗位申请通过是您进入项目的前置条件，通过后才能接收相关项目的邀请</li>
          <li>项目是平台基于您的岗位派发的具体任务，其中试标项目可能对应很多个不同的正式项目</li>
          <li>试标项目每个专家仅有一次参与机会，但不合格不会影响您参与其他非此试标所关联项目的资格。</li>
        </ul>
      </div>
    </Card>
  )

  return (
    <>
      <Main className='py-8 pb-32 md:pb-8 md:mx-16 lg:px-8 flex flex-col'>
        {/* 顶部导航栏 */}
        <div className='mb-8 flex items-start justify-between'>
          <button
            onClick={handleBack}
            className='flex items-center gap-1 rounded-lg border border-black/10 px-2 py-2 text-sm font-medium transition-colors hover:bg-gray-50'
          >
            <IconArrowLeft className='h-4 w-4' />
            返回
          </button>
          {!isProjectEnded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={!allBound ? 'cursor-not-allowed' : ''}>
                  <Button
                    type='button'
                    onClick={handleSubmit}
                    disabled={projectLoading || !allBound || submitting}
                    className='h-11 rounded-lg px-7 text-base font-medium disabled:bg-[#c9c9c9] disabled:text-white disabled:opacity-100 disabled:pointer-events-none'
                  >
                    {submitting ? '进入中...' : '进入项目'}
                  </Button>
                </span>
              </TooltipTrigger>
              {!allBound && (
                <TooltipContent>
                  请先完成下面流程
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>

        <div className='flex flex-col gap-9 lg:flex-row flex-1'>
          {/* 左侧区域 */}
          <div className='flex flex-col gap-9 lg:w-[340px] lg:shrink-0'>
            {/* 页面标题 */}
            <div className='flex items-center gap-[10px]'>
              <img src={titleIcon} alt='项目图标' className='h-8 w-8' />
              <h1 className='text-2xl font-medium tracking-[0.48px]'>
                {projectLoading ? '加载中...' : (projectData?.project?.alias || projectData?.project?.name || 'Coding Rubric')}
              </h1>
            </div>
            
            {/* 项目统计 */}
            <div className='space-y-4'>
              <div className='flex items-end gap-3 ml-[-4px]'>
                <img
                  src={starIcon}
                  alt=''
                  className='h-[23px] w-[24px] self-end mb-0.5'
                  draggable={false}
                />
                {/* 文案与分数块做底部对齐 */}
                <div className='flex items-end gap-2'>
                  <span className='text-base font-semibold text-black'>
                    项目综合评分：
                  </span>
                  <div
                    className={cn(
                      'inline-flex h-[38px] items-center rounded-[4px] px-4 text-[20px] font-medium',
                      avgScorePillClass
                    )}
                  >
                    {projectStatsLoading ? '—' : averageScore.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                {scoreDistribution.map((row) => (
                  <div key={row.label} className='grid grid-cols-[44px_1fr_20px] items-center gap-3'>
                    <div className='flex items-center gap-1 text-sm text-primary'>
                      <span>{row.label}</span>
                      {row.label === '2.5' && (
                        <Tooltip open={scoreLineTipOpen} onOpenChange={setScoreLineTipOpen}>
                          <TooltipTrigger asChild>
                            <button
                              type='button'
                              className='inline-flex items-center text-primary/60'
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setScoreLineTipOpen((v) => !v)
                              }}
                              aria-label='2.5 分警戒线说明'
                            >
                              <IconInfoCircle className='h-4 w-4' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            className='bg-foreground text-background max-w-[320px]'
                            arrowClassName='bg-foreground fill-foreground'
                          >
                            <span>详情见：</span>
                            <a
                              href='https://meetchances.feishu.cn/wiki/TlFVw1iSuisHKakApQacUbSQnBf'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='ml-1 text-background underline underline-offset-2'
                            >
                              飞书文档
                            </a>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className='h-3 w-full rounded-full border border-black/10 bg-white'>
                      <div
                        className={cn(
                          'h-full rounded-full',
                          row.isPositive
                            ? 'bg-[rgb(170,161,242)]'
                            : 'bg-[#FFDEDD]'
                        )}
                        style={{
                          width:
                            totalScoreCount > 0
                              ? `${Math.min(100, Math.round((row.count / totalScoreCount) * 100))}%`
                              : '0%',
                        }}
                      />
                    </div>
                    <div className='text-right text-sm text-black/40'>
                      {row.count}
                    </div>
                  </div>
                ))}
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Card className='rounded-xl border border-black/10 py-3 px-5 shadow-[0px_0px_4px_0px_#0000001A]'>
                    <div className='flex items-center gap-3'>
                      <img src={totalGetIcon} alt='' className='h-8 w-8' draggable={false} />
                      <div className='text-xl text-black'>
                        {projectStatsLoading
                          ? '—'
                          : earnedAmount.toLocaleString('zh-CN', {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })}
                      </div>
                    </div>
                  </Card>
                  <div className='text-center text-xs text-black/50'>
                    此项目至今已赚
                  </div>
                </div>
                <div className='space-y-2'>
                  <Card className='rounded-xl border border-black/10 py-3 px-5 shadow-[0px_0px_4px_0px_#0000001A]'>
                    <div className='flex items-center gap-3'>
                      <img src={rateIcon} alt='' className='h-8 w-8' draggable={false} />
                      <div className='text-xl text-black'>
                        {projectStatsLoading
                          ? '—'
                          : `${(Math.max(0, Math.min(1, firstReviewPassRate)) * 100).toFixed(1)}%`}
                      </div>
                    </div>
                  </Card>
                  <div className='text-center text-xs text-black/50'>初审通过率</div>
                </div>
              </div>
            </div>

            {/* 任务报酬 */}
            <div className='flex flex-col gap-6'>
              <div className='px-4 pb-4'>
                <h2 className='mb-5 text-base font-semibold'>任务报酬</h2>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-black'>{projectLoading ? '加载中...' : paymentTypeLabel}：</span>
                    <span className='text-black/50'>
                      {projectLoading ? '...' : `${projectData?.project?.price_per_unit ?? 200}/${paymentUnit}`}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-black'>结算时间：</span>
                    <span className='text-black/50'>
                      {projectLoading ? '...' : (projectData?.project?.settlement_time || '暂无')}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-black'>结算条件：</span>
                    <span className='text-black/50'>
                      {projectLoading ? '...' : (projectData?.project?.settlement_condition || '暂无')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 理解岗位与项目的关系 */}
            {jobProjectRelationshipCard}

          </div>

          {/* 右侧区域 - 工作指南和提交记录 */}
          <div className='flex flex-1 flex-col gap-6 min-w-0 min-h-0'>
            {/* 工作指南（有链接时显示） */}
            {isProjectEnded ? (
              <div className='flex w-full flex-1 min-h-0 flex-col mt-1 gap-6'>
                <div className='flex flex-col gap-8'>
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      disabled
                      className='h-11 rounded-lg px-7 text-base font-medium disabled:bg-[#c9c9c9] disabled:text-white disabled:opacity-100 disabled:pointer-events-none'
                    >
                      已结束
                    </Button>
                  </div>

                  <div className='flex items-center justify-between'>
                    <h2 className='text-base font-semibold tracking-[0.32px]'>工作指南</h2>
                    <button
                      type='button'
                      onClick={() => setHelpOpen(true)}
                      className='rounded-lg border border-black/10 px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-50'
                    >
                      寻求支持
                    </button>
                  </div>
                </div>
                {bindingCardsSection}

                <Card className='flex w-full flex-1 min-h-0 items-center justify-center rounded-xl border border-primary/20'>
                  <div className='flex max-w-[560px] flex-col items-center px-6 text-center'>
                    <img
                      src={finishProjectPng}
                      alt='项目已结束'
                      className='h-36 w-auto select-none'
                      draggable={false}
                    />
                    <div className='mt-4 text-lg font-semibold tracking-[0.32px]'>
                      项目已结束
                    </div>
                    <div className='mt-2 text-sm leading-6 text-black/60'>
                      该项目目前已结束因此无权限查看标注指南，请等待你的岗位资质匹配到新的项目，或前往职位列表去申请新的岗位！
                    </div>
                  </div>
                </Card>
              </div>
            ) : hasWorkGuide ? (
              <div className='flex flex-1 flex-col gap-5 min-h-0'>
                {bindingCardsSection}

                <div className='flex items-center justify-between gap-4'>
                  <div className='flex-1 min-w-0 flex items-center gap-3 flex-wrap'>
                    <h2 className='text-base font-semibold tracking-[0.32px] shrink-0'>
                      工作指南
                    </h2>
                    {currentTrialGroupLink && (
                      <p className='text-sm text-black/70'>
                        在开始前，请先通过
                        <a
                          href={currentTrialGroupLink}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary underline hover:text-primary/80 transition-colors mx-1'
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(currentTrialGroupLink, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          试标群链接
                        </a>
                        进群后才能获得工作指南和工作台权限！
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-5 shrink-0'>
                    <button
                      type='button'
                      onClick={() => setHelpOpen(true)}
                      className='rounded-lg border border-black/10 px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-50'
                    >
                      寻求支持
                    </button>
                  </div>
                </div>

                <div className='relative flex-1 min-h-0 overflow-hidden rounded-xl border border-primary/20'>
                  {projectData?.project?.work_guide ? (
                    <FeishuDocViewer
                      docUrl={projectData.project.work_guide}
                      className='h-full w-full'
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              bindingCardsSection
            )}
          </div>
        </div>

        {/* 飞书绑定弹窗 */}
        <Dialog open={feishuDialogOpen} onOpenChange={setFeishuDialogOpen}>
          <DialogContent className='!w-[95vw] sm:!w-[80vw] !max-w-none p-6 sm:p-16 max-h-[90vh] overflow-y-auto'>
            {/* 两步流程 */}
            <div className='flex flex-col sm:flex-row items-start justify-center gap-12 sm:gap-[200px]'>
              {/* 步骤1 - 安装飞书 */}
              <div className='relative flex w-full sm:w-[380px] flex-col gap-8'>
                {/* 数字标识 */}
                <div className='relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#C994F7]'>
                  <span className='text-2xl font-semibold leading-[1.5] tracking-[0.48px] text-white'>1</span>
                </div>
                
                {/* 步骤内容 */}
                <div className='flex flex-col gap-5'>
                  <div className='flex flex-col gap-3'>
                    <h3 className='text-2xl font-semibold leading-[1.5] tracking-[0.48px] text-black'>
                      安装飞书
                    </h3>
                    <div className='text-sm font-medium leading-[1.6] text-[rgba(0,0,0,0.7)]'>
                      <p className='mb-0'>飞书是本项目的主要沟通软件，</p>
                      <p className='mb-0'>项目的录取、培训、审核结果都会通过飞书通知来传达，</p>
                    </div>
                    <p className='text-sm font-medium leading-[1.6] text-black'>
                      请注意开启消息提醒
                    </p>
                  </div>
                  
                  <a 
                    href='https://www.feishu.cn/download'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm font-medium leading-[1.6] text-primary underline decoration-solid transition-colors hover:text-primary/80'
                  >
                    前往飞书官网下载
                  </a>
                </div>
                
                {/* 连接线 - 仅在桌面端显示 */}
                <div className='absolute left-[56px] top-[18px] h-0 w-[504px] hidden sm:block'>
                  <svg width='504' height='2' viewBox='0 0 504 2' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <line x1='0' y1='1' x2='504' y2='1' stroke='#4E02E4' strokeWidth='2' strokeDasharray='4 4'/>
                  </svg>
                </div>
              </div>
              
              {/* 步骤2 - 授权飞书机器人 */}
              <div className='relative flex w-full sm:w-[380px] flex-col gap-8'>
                {/* 数字标识 */}
                <div className='relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#C994F7]'>
                  <span className='text-2xl font-semibold leading-[1.5] tracking-[0.48px] text-white'>2</span>
                </div>
                
                {/* 步骤标题 */}
                <h3 className='text-2xl font-semibold leading-[1.5] tracking-[0.48px] text-black'>
                  授权飞书机器人
                </h3>
                
                {/* 图标展示区域 */}
                <div className='flex items-center gap-12'>
                  {/* 飞书图标 */}
                  <div className='flex flex-col items-center gap-3'>
                    <div className='h-[72px] w-[74px] overflow-hidden'>
                      <img 
                        src='/images/feishu.png'
                        alt='飞书'
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <p className='text-center text-base font-semibold leading-[1.6] text-black'>飞书</p>
                  </div>
                  
                  {/* 中间箭头 */}
                  <div className='flex items-center justify-center'>
                    <svg xmlns='http://www.w3.org/2000/svg' width='32' height='15' viewBox='0 0 32 15' fill='none'>
                      <path d='M31.7071 8.07039C32.0976 7.67986 32.0976 7.0467 31.7071 6.65617L25.3431 0.292213C24.9526 -0.0983109 24.3195 -0.0983109 23.9289 0.292213C23.5384 0.682738 23.5384 1.3159 23.9289 1.70643L29.5858 7.36328L23.9289 13.0201C23.5384 13.4107 23.5384 14.0438 23.9289 14.4343C24.3195 14.8249 24.9526 14.8249 25.3431 14.4343L31.7071 8.07039ZM0 7.36328V8.36328H15.5V7.36328V6.36328H0V7.36328ZM15.5 7.36328V8.36328H31V7.36328V6.36328H15.5V7.36328Z' fill='black' fillOpacity='0.5'/>
                    </svg>
                  </div>
                  
                  {/* 一面千识图标 */}
                  <div className='flex flex-col items-center gap-3'>
                    <div className='h-[72px] w-[72px]'>
                      <img 
                        src='/images/logo-circle.svg'
                        alt='一面千识'
                        className='h-full w-full object-contain'
                      />
                    </div>
                    <p className='text-center text-base font-semibold leading-[1.6] text-black'>一面千识</p>
                  </div>
                </div>
                
                {/* 说明文字 */}
                <div className='flex flex-col gap-3 text-sm font-medium leading-[1.6]'>
                  <p className='text-[rgba(0,0,0,0.7)]'>
                    安装飞书客户端后，点击下面按钮进行跳转授权
                  </p>
                  <Button
                    type='button'
                    onClick={() => {
                      if (feishuAuth?.auth_url) {
                        window.open(feishuAuth.auth_url, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    disabled={authLoading || !feishuAuth?.auth_url}
                    className='w-fit'
                  >
                    {authLoading ? '获取授权链接中…' : '前往授权'}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 刷新状态提示和按钮 */}
            <div className='mt-8 sm:mt-12 flex flex-col items-center gap-4 border-t border-black/10 pt-6 sm:pt-8'>
              <p className='text-center text-sm leading-[1.6] text-black/70'>
                完成飞书绑定后，点击下方按钮刷新绑定状态
              </p>
              <Button 
                onClick={confirmFeishuBind}
                className='h-11 rounded-lg px-8 text-base font-medium'
              >
                我已成功绑定
                </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 数据协议弹窗 */}
        <Dialog open={agreementDialogOpen} onOpenChange={setAgreementDialogOpen}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>数据与工作协议</DialogTitle>
              <DialogDescription>
                请确认您已阅读并同意了
                <a 
                  href='https://meetchances.feishu.cn/wiki/L1BpwiRD1iDNqakKcW0cLhoxnbh'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary underline hover:text-primary/80 transition-colors mx-1'
                >
                  《用户数据生产提交协议》
                </a>
              </DialogDescription>
            </DialogHeader>
            {!isAgreementBound && (
              <DialogFooter>
                <Button variant='outline' onClick={() => setAgreementDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={confirmAgreementBind}>
                  确认
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* 试标群引导弹窗 */}
        <Dialog 
          open={trialGroupDialogOpen} 
          onOpenChange={(open) => {
            // 只允许通过按钮或 ESC 键关闭，不允许点击遮罩关闭
            if (!open) {
              handleTrialGroupClose()
            }
          }}
        >
          <DialogContent 
            className='sm:max-w-md'
            onInteractOutside={(e) => {
              // 阻止点击遮罩关闭弹窗
              e.preventDefault()
            }}
            onEscapeKeyDown={() => {
              // 允许 ESC 键关闭
              handleTrialGroupClose()
            }}
          >
            <DialogHeader className='text-center'>
              <DialogTitle className='text-center'>加入试标群</DialogTitle>
              <DialogDescription className='text-center space-y-3 pt-2'>
                <p className='text-base font-medium text-black leading-6'>
                  在开始前，请先通过试标群链接进群后才能获得工作指南和工作台权限！
                </p>
                <p className='text-xs text-black/50 leading-5'>
                  如果已经加入试标群，请直接关闭弹窗。
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='justify-center'>
              {trialGroupLink && (
                <Button onClick={handleTrialGroupConfirm} className='w-full'>
                  前往加入试标群
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 寻求支持弹窗 */}
        <SupportDialog open={helpOpen} onOpenChange={setHelpOpen} />
      </Main>
    </>
  )
}

