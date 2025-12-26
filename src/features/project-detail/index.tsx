import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { IconArrowLeft } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import { useProjectDetail, useTalentAuthURL, bindDataAgreement } from './api'
import titleIcon from './images/title.png'
import feishuIcon from './images/feishu.png'
import dataIcon from './images/data.png'
import payIcon from './images/pay.png'

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
  const [expandedGuide, setExpandedGuide] = useState(false)
  const [guideLoading, setGuideLoading] = useState(true)
  const [shouldPreload, setShouldPreload] = useState(false)

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

  // 组件卸载时清理
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 延迟触发预加载，避免影响初始加载性能
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setShouldPreload(true)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // 超时自动隐藏加载状态（避免 iframe onLoad 事件不触发）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setGuideLoading(false)
      }
    }, 1500) // 1.5秒后自动隐藏加载提示
    
    return () => clearTimeout(timer)
  }, [])

  // 监听 ESC 键关闭全屏工作指南 & 阻止页面滚动
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedGuide) {
        setExpandedGuide(false)
      }
    }
    
    if (expandedGuide) {
      // 阻止页面滚动
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [expandedGuide])

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

  return (
    <>
      <Main className='min-h-screen py-8 pb-32 md:pb-8 md:mx-16 lg:px-8'>
        {/* 顶部导航栏 */}
        <div className='mb-8 flex items-center justify-between'>
          <button
            onClick={handleBack}
            className='flex items-center gap-1 rounded-lg border border-black/10 px-2 py-2 text-sm font-medium transition-colors hover:bg-gray-50'
          >
            <IconArrowLeft className='h-4 w-4' />
            返回
          </button>
          <div className='flex items-center gap-5'>
            <button
              onClick={() => setHelpOpen(true)}
              className='rounded-lg border border-black/10 px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-50'
            >
              寻求支持
            </button>
            <Button
              type='button'
              onClick={handleSubmit}
              disabled={projectLoading || !allBound || submitting || isProjectEnded}
              className='h-11 rounded-lg px-7 text-base font-medium disabled:bg-[#c9c9c9] disabled:text-white disabled:opacity-100 disabled:pointer-events-none'
            >
              {submitting ? '进入中...' : isProjectEnded ? '项目已结束' : '进入项目'}
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-9 lg:flex-row'>
          {/* 左侧区域 */}
          <div className='flex flex-col gap-9 lg:w-[340px] lg:shrink-0'>
            {/* 页面标题 */}
            <div className='flex items-center gap-[10px]'>
              <img src={titleIcon} alt='项目图标' className='h-8 w-8' />
              <h1 className='text-2xl font-medium tracking-[0.48px]'>
                {projectLoading ? '加载中...' : (projectData?.project?.alias || projectData?.project?.name || 'Coding Rubric')}
              </h1>
            </div>

            <div className='flex flex-col gap-6'>
              {/* 任务报酬 */}
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

              {/* 绑定状态卡片 */}
              {/* 飞书绑定 */}
              {requireFeishu && (
              <button
                onClick={handleFeishuBind}
                className='flex w-full items-center justify-center rounded-xl border border-primary/20 p-6 transition-all duration-200 cursor-pointer hover:border-primary hover:bg-[linear-gradient(90deg,rgba(78,2,228,0.05)_0%,rgba(78,2,228,0.05)_100%)] hover:shadow-sm hover:scale-[1.01]'
              >
                <div className='flex flex-1 items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <img src={feishuIcon} alt='飞书' className='h-8 w-8' />
                    <span className='text-base font-semibold'>飞书绑定</span>
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
                    <span className='text-sm font-medium text-primary underline decoration-solid'>待绑定</span>
                  )}
                </div>
              </button>
              )}

              {/* 数据与工作协议 */}
              {requireAgreement && (
              <button
                onClick={handleAgreementBind}
                className='flex w-full items-center justify-center rounded-xl border border-primary/20 p-6 transition-all duration-200 cursor-pointer hover:border-primary hover:bg-[linear-gradient(90deg,rgba(78,2,228,0.05)_0%,rgba(78,2,228,0.05)_100%)] hover:shadow-sm hover:scale-[1.01]'
              >
                <div className='flex flex-1 items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <img src={dataIcon} alt='数据协议' className='h-8 w-8' />
                    <span className='text-base font-semibold'>数据与工作协议</span>
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
                    <span className='text-sm font-medium text-primary underline decoration-solid'>待确认</span>
                  )}
                </div>
              </button>
              )}

              {/* 支付绑定 */}
              {requirePayment && (
              <button
                onClick={handlePaymentBind}
                className='flex w-full items-center justify-center rounded-xl border border-primary/20 p-6 transition-all duration-200 cursor-pointer hover:border-primary hover:bg-[linear-gradient(90deg,rgba(78,2,228,0.05)_0%,rgba(78,2,228,0.05)_100%)] hover:shadow-sm hover:scale-[1.01]'
              >
                <div className='flex flex-1 items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <img src={payIcon} alt='支付绑定' className='h-8 w-8' />
                    <span className='text-base font-semibold'>支付绑定</span>
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
                    <span className='text-sm font-medium text-primary underline decoration-solid'>待绑定</span>
                  )}
                </div>
              </button>
              )}
            </div>

          </div>

          {/* 右侧区域 - 工作指南和提交记录 */}
          <div className='flex flex-1 flex-col gap-6 min-w-0'>
            {/* 工作指南（有链接时显示） */}
            {hasWorkGuide && (
            <div className='flex flex-col gap-5'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <h2 className='text-base font-semibold tracking-[0.32px]'>工作指南</h2>
                  {projectData?.project?.trial_group_url && (
                    <a
                      href={projectData.project.trial_group_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm font-medium text-primary underline decoration-solid transition-colors hover:text-primary/80'
                    >
                      试标群链接
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setExpandedGuide(!expandedGuide)}
                  className='flex h-6 w-6 items-center justify-center text-black/70 transition-colors hover:text-black'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19.3845 4C19.696 4 19.9535 4.23151 19.9943 4.53188L19.9999 4.61538V7.89744C19.9999 8.2373 19.7244 8.51282 19.3845 8.51282C19.073 8.51282 18.8155 8.28131 18.7747 7.98094L18.7691 7.89744V5.23077H16.1024C15.7909 5.23077 15.5334 4.99926 15.4927 4.69889L15.4871 4.61538C15.4871 4.30384 15.7186 4.04637 16.0189 4.00562L16.1024 4H19.3845Z" fill="currentColor"/>
                    <path d="M18.9495 4.18024C19.1898 3.93992 19.5795 3.93992 19.8198 4.18024C20.0383 4.39872 20.0581 4.7406 19.8794 4.98151L19.8198 5.05053L14.8967 9.9736C14.6564 10.2139 14.2668 10.2139 14.0264 9.9736C13.808 9.75513 13.7881 9.41325 13.9668 9.17234L14.0264 9.10332L18.9495 4.18024Z" fill="currentColor"/>
                    <path d="M4.61538 15.4883C4.92693 15.4883 5.1844 15.7198 5.22515 16.0202L5.23077 16.1037V18.7703H7.89744C8.20898 18.7703 8.46645 19.0018 8.5072 19.3022L8.51282 19.3857C8.51282 19.6973 8.28131 19.9547 7.98094 19.9955L7.89744 20.0011H4.61538C4.30384 20.0011 4.04637 19.7696 4.00562 19.4692L4 19.3857V16.1037C4 15.7638 4.27552 15.4883 4.61538 15.4883Z" fill="currentColor"/>
                    <path d="M9.10332 14.0279C9.34364 13.7876 9.73328 13.7876 9.9736 14.0279C10.1921 14.2464 10.2119 14.5883 10.0332 14.8292L9.9736 14.8982L5.05053 19.8213C4.8102 20.0616 4.42056 20.0616 4.18024 19.8213C3.96177 19.6028 3.94191 19.2609 4.12066 19.02L4.18024 18.951L9.10332 14.0279Z" fill="currentColor"/>
                    <path d="M11.1795 4.82031C11.5194 4.82031 11.7949 5.09583 11.7949 5.4357C11.7949 5.74724 11.5634 6.00472 11.263 6.04546L11.1795 6.05108H7.07697C6.54559 6.05108 6.1091 6.45436 6.05662 6.9718L6.05133 7.07672V11.1793C6.05133 11.5192 5.77581 11.7947 5.43594 11.7947C5.1244 11.7947 4.86692 11.5632 4.82617 11.2628L4.82056 11.1793V7.07672C4.82056 5.87636 5.75701 4.89544 6.93948 4.82443L7.07697 4.82031H11.1795Z" fill="currentColor"/>
                    <path d="M18.564 12.207C18.8756 12.207 19.133 12.4385 19.1738 12.7389L19.1794 12.8224V16.925C19.1794 18.1253 18.2429 19.1063 17.0605 19.1773L16.923 19.1814H11.9999C11.66 19.1814 11.3845 18.9059 11.3845 18.566C11.3845 18.2545 11.616 17.997 11.9164 17.9562L11.9999 17.9506H16.923C17.4544 17.9506 17.8908 17.5473 17.9433 17.0299L17.9486 16.925V12.8224C17.9486 12.4825 18.2241 12.207 18.564 12.207Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              
              <div className='relative h-[600px] overflow-hidden rounded-xl border border-primary/20'>
                {guideLoading && (
                  <div className='absolute inset-0 z-10 flex items-center justify-center bg-white'>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
                      <p className='text-sm text-black/60'>加载中...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={projectData?.project?.work_guide}
                  className='h-full w-full border-0'
                  title='工作指南'
                  onLoad={() => {
                    if (isMountedRef.current) {
                      setGuideLoading(false)
                    }
                  }}
                  loading='eager'
                />
              </div>
            </div>
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

        {/* 寻求支持弹窗 */}
        <SupportDialog open={helpOpen} onOpenChange={setHelpOpen} />
        
        {/* 隐藏的预加载 iframe - 延迟1秒后加载 */}
        {shouldPreload && projectData?.project?.work_guide && (
          <iframe
            src={projectData.project.work_guide}
            className='hidden'
            title='工作指南预加载'
            loading='eager'
            aria-hidden='true'
          />
        )}
      </Main>

      {/* 全屏工作指南 */}
      {expandedGuide && hasWorkGuide && (
        <div 
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200'
          onClick={() => setExpandedGuide(false)}
        >
          <div 
            className='relative h-full w-full max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setExpandedGuide(false)}
              className='absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black/70 shadow-md transition-all hover:bg-white hover:text-black hover:shadow-lg'
              aria-label='关闭'
            >
              <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <line x1='18' y1='6' x2='6' y2='18'></line>
                <line x1='6' y1='6' x2='18' y2='18'></line>
              </svg>
            </button>
            
            {/* iframe 内容 */}
            <iframe
              src={projectData?.project?.work_guide}
              className='h-full w-full rounded-lg border-0'
              title='工作指南（全屏）'
              loading='eager'
            />
          </div>
        </div>
      )}
    </>
  )
}

