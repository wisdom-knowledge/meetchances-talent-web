import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { RichText } from '@/components/ui/rich-text'
import { Button } from '@/components/ui/button'
import { UploadArea } from '@/features/resume-upload/upload-area'
import { useNavigate } from '@tanstack/react-router'
import { applyJob, generateInviteToken, InviteTokenType, useJobDetailQuery } from '@/features/jobs/api'
import { IconArrowLeft, IconBriefcase, IconWorldPin, IconVideo, IconVolume, IconMicrophone, IconCircleCheckFilled, IconUpload } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { IconLoader2 } from '@tabler/icons-react'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
// import { cn } from '@/lib/utils'
import { LocalCameraPreview } from '@/features/interview/components/local-camera-preview'
import { SelectDropdown } from '@/components/select-dropdown'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMediaDeviceSelect } from '@livekit/components-react'
import { DeviceTestStatus } from '@/types/device'
import { uploadTalentResume, fetchTalentResumeDetail } from '@/features/resume-upload/utils/api'
import TalentResumePreview from '@/features/talent-pool/components/talent-resume-preview'
import type { ResumeFormValues } from '@/features/resume/data/schema'
import { mapStructInfoToResumeFormValues, mapResumeFormValuesToStructInfo } from '@/features/resume/data/struct-mapper'
import type { StructInfo } from '@/features/resume-upload/types/struct-info'
import { patchTalentResumeDetail } from '@/features/resume-upload/utils/api'
import { handleServerError } from '@/utils/handle-server-error'
import { useAuthStore } from '@/stores/authStore'
import { confirmResume, useJobApplyWorkflow, postNodeAction, NodeActionTrigger, getInterviewNodeId } from '@/features/interview/api'
import { Steps } from '@/features/interview/components/steps'
import { useJobApplyProgress, JobApplyNodeStatus } from '@/features/interview/api'
import searchPng from '@/assets/images/search.png'
import { getPreferredDeviceId, setPreferredDeviceIdSmart } from '@/lib/devices'
import { ConnectionQualityBarsStandalone } from '@/components/interview/connection-quality-bars'
import { useIsMobile } from '@/hooks/use-mobile'

interface InterviewPreparePageProps {
  jobId?: string | number
  inviteToken?: string
  isSkipConfirm?: boolean
  jobApplyIdFromRoute?: string | number
}

enum ViewMode {
  Job = 'job',
  InterviewPrepare = 'interview-prepare',
  InterviewPendingReview = 'interview-pending-review',
  TrailTask = 'trail-task',
  EducationEval = 'education-eval',
  AllApproved = 'all-approved',
  Rejected = 'rejected',
}

// steps 组件迁移为独立组件，见 features/interview/components/steps.tsx

// Duplicate definition introduced during merge. Keeping the enhanced definition below and removing this one.

  /**
   * 设备选择器
   * @param param0
   * @returns
   */
  function DeviceSelectorsRow({
    camActiveDeviceId,
    camDevices,
    onCamChange,
    cameraStatus,
    micStatus,
    spkStatus,
    onMicStatusChange,
    onSpkStatusChange,
  }: {
    camActiveDeviceId?: string
    camDevices: Array<{ deviceId: string; label: string }>
    onCamChange: (id: string) => void
    cameraStatus: DeviceTestStatus
    micStatus: DeviceTestStatus
    spkStatus: DeviceTestStatus
    onMicStatusChange: (_s: DeviceTestStatus) => void
    onSpkStatusChange: (_s: DeviceTestStatus) => void
  }) {
    const mic = useMediaDeviceSelect({ kind: 'audioinput', requestPermissions: true })
    const spk = useMediaDeviceSelect({ kind: 'audiooutput', requestPermissions: true })

    // 首次挂载时，应用本地存储的设备偏好
    useEffect(() => {
      const preferredMic = getPreferredDeviceId('audioinput')
      if (preferredMic && preferredMic !== mic.activeDeviceId) {
        mic.setActiveMediaDevice(preferredMic)
      }
      const preferredSpk = getPreferredDeviceId('audiooutput')
      if (preferredSpk && preferredSpk !== spk.activeDeviceId) {
        spk.setActiveMediaDevice(preferredSpk)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 当音频输入设备自动选择时，保存为默认选择
    useEffect(() => {
      const preferredMic = getPreferredDeviceId('audioinput')
      if (!preferredMic && mic.activeDeviceId) {
        void setPreferredDeviceIdSmart('audioinput', mic.activeDeviceId, mic.devices)
      }
    }, [mic.activeDeviceId, mic.devices])

    // 当音频输出设备自动选择时，保存为默认选择
    useEffect(() => {
      const preferredSpk = getPreferredDeviceId('audiooutput')
      if (!preferredSpk && spk.activeDeviceId) {
        void setPreferredDeviceIdSmart('audiooutput', spk.activeDeviceId, spk.devices)
      }
    }, [spk.activeDeviceId, spk.devices])

    const statusText = (s: DeviceTestStatus) => {
      switch (s) {
        case DeviceTestStatus.Success:
          return '测试完成'
        case DeviceTestStatus.Testing:
          return '测试中'
        case DeviceTestStatus.Failed:
          return '测试失败'
        default:
          return '未测试'
      }
    }

    const renderStatus = (s: DeviceTestStatus) => {
      if (s === DeviceTestStatus.Success) {
        return (
          <div className='text-xs text-primary flex items-center gap-1'>
            <IconCircleCheckFilled className='h-4 w-4 text-primary' />
            测试完成
          </div>
        )
      }
      return <div className='text-xs text-muted-foreground'>{statusText(s)}</div>
    }

    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>

        {/* 摄像头选择 */}
        <div className='flex flex-col gap-2 '>
          <div className="flex items-center gap-2">
            <IconVideo className='h-4 w-4' />
            <SelectDropdown
              isControlled
              value={camActiveDeviceId}
              onValueChange={(id: string) => onCamChange(id)}
              placeholder='选择摄像头'
              className='h-9 flex-1'
              useFormControl={false}
              disabled={cameraStatus === DeviceTestStatus.Failed}
              items={camDevices.map((d) => ({ label: d.label || d.deviceId, value: d.deviceId }))}
            />
          </div>
          {renderStatus(cameraStatus)}
        </div>

        {/* 耳机/扬声器 */}
        <div className='flex flex-col gap-2 '>
          <div className='flex items-center gap-2'>
            <IconVolume className='h-4 w-4' />
            <SelectDropdown
              isControlled
              value={spk.activeDeviceId}
              onValueChange={(v) => {
                spk.setActiveMediaDevice(v)
                void setPreferredDeviceIdSmart('audiooutput', v, spk.devices)
                onSpkStatusChange(DeviceTestStatus.Testing)
                setTimeout(() => onSpkStatusChange(DeviceTestStatus.Success), 500)
              }}
              placeholder='选择输出设备（耳机/扬声器）'
              className='h-9 flex-1 overflow-x-hidden truncate'
              useFormControl={false}
              items={spk.devices.map((d) => ({ label: d.label || d.deviceId, value: d.deviceId }))}
            />
          </div>
          {renderStatus(spkStatus)}
        </div>

        {/* 麦克风 */}
        <div className='flex flex-col gap-2 '>
          <div className='flex items-center gap-2'>
            <IconMicrophone className='h-4 w-4' />
            <SelectDropdown
              isControlled
              value={mic.activeDeviceId}
              onValueChange={(v) => {
                mic.setActiveMediaDevice(v)
                void setPreferredDeviceIdSmart('audioinput', v, mic.devices)
                onMicStatusChange(DeviceTestStatus.Testing)
                setTimeout(() => onMicStatusChange(DeviceTestStatus.Success), 500)
              }}
              placeholder='选择麦克风'
              className='h-9 flex-1 overflow-x-hidden truncate'
              useFormControl={false}
              items={mic.devices.map((d) => ({ label: d.label || d.deviceId, value: d.deviceId }))}
            />
          </div>
          {renderStatus(micStatus)}
        </div>



      </div>
    )
  }

export default function InterviewPreparePage({ jobId, inviteToken, isSkipConfirm = false, jobApplyIdFromRoute }: InterviewPreparePageProps) {
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reinterviewOpen, setReinterviewOpen] = useState(false)
  const [reinterviewReason, setReinterviewReason] = useState<string>('')
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadedThisVisit, setUploadedThisVisit] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeValues, setResumeValues] = useState<ResumeFormValues | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Job)
  const [cameraStatus, setCameraStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [micStatus, setMicStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [spkStatus, setSpkStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [stage, setStage] = useState<'headphone' | 'mic' | 'camera'>('camera')
  const [jobApplyId, setJobApplyId] = useState<number | string | null>(jobApplyIdFromRoute ?? null)
  const cam = useMediaDeviceSelect({ kind: 'videoinput', requestPermissions: viewMode === ViewMode.InterviewPrepare })

  // 当视频设备自动选择时，保存为默认选择
  useEffect(() => {
    const preferred = getPreferredDeviceId('videoinput')
    if (!preferred && cam.activeDeviceId) {
      void setPreferredDeviceIdSmart('videoinput', cam.activeDeviceId, cam.devices)
    }
  }, [cam.activeDeviceId, cam.devices])
  const user = useAuthStore((s) => s.auth.user)
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const { data: progressNodes, isLoading: isProgressLoading } = useJobApplyProgress(jobApplyId ?? null, Boolean(jobApplyId))
  const { data: workflow } = useJobApplyWorkflow(jobApplyId ?? null, Boolean(jobApplyId))
  const interviewNodeId = useMemo(() => getInterviewNodeId(workflow), [workflow])
  const interviewNodeStatus = useMemo(() => {
    const nodes = progressNodes ?? []
    const ai = nodes.find((n) => n.node_name.includes('AI 面试'))
    return ai?.node_status
  }, [progressNodes])

  // 将确认后的后续动作抽取为独立方法，供不同入口复用
  const proceedAfterResumeConfirm = useCallback(async () => {
    if (viewMode === ViewMode.Job) {
      if (jobApplyId != null) {
        try {
          await confirmResume(jobApplyId)
          const firstNodeId = workflow?.nodes?.[0]?.id
          if (firstNodeId != null) {
            const res = await postNodeAction({ node_id: firstNodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
            if (res.success && jobApplyId != null) {
              queryClient.setQueryData(
                ['job-apply-workflow', jobApplyId],
                (prev: unknown) => {
                  if (!prev || typeof prev !== 'object') return prev
                  const p = prev as { nodes?: Array<{ status?: number | string }> }
                  if (!Array.isArray(p.nodes) || p.nodes.length === 0) return prev
                  const nextNodes = [...p.nodes]
                  const cur = nextNodes[0]
                  const curNum = typeof cur.status === 'number' ? cur.status : parseInt(String(cur.status ?? '0'), 10)
                  const moved = curNum === 10 ? 20 : 20
                  nextNodes[0] = { ...cur, status: moved }
                  return { ...(prev as Record<string, unknown>), nodes: nextNodes }
                }
              )
            }
          }
        } catch (_e) {
          // ignore, allow navigation even if confirm fails
        }
      }
      setViewMode(ViewMode.InterviewPrepare)
    } else {
      if (!interviewNodeId) return
      navigate({ to: '/interview/session', search: { job_id: (jobId as string | number) || '', job_apply_id: jobApplyId ?? undefined, interview_node_id: interviewNodeId } })
    }
  }, [viewMode, jobApplyId, workflow, queryClient, interviewNodeId, jobId, navigate])

  const handleConfirmResumeClick = useCallback(async () => {
    if (uploadingResume || !resumeValues) return
    if (uploadedThisVisit) {
      setConfirmOpen(true)
      return
    }
    await proceedAfterResumeConfirm()
  }, [uploadingResume, resumeValues, uploadedThisVisit, proceedAfterResumeConfirm])

  // 确保在离开页面前主动释放媒体资源，避免设备权限长期占用
  const releaseAllMediaStreams = useCallback(() => {
    try {
      type MediaWithObject = HTMLMediaElement & { srcObject?: MediaStream | null }
      const medias = Array.from(document.querySelectorAll('video, audio')) as MediaWithObject[]
      for (const m of medias) {
        const stream = (m as MediaWithObject).srcObject ?? null
        if (stream) {
          try { stream.getTracks().forEach((t) => t.stop()) } catch { /* ignore */ }
          try { (m as MediaWithObject).srcObject = null } catch { /* ignore */ }
        }
        try { m.pause?.() } catch { /* ignore */ }
        try { (m as HTMLMediaElement).removeAttribute('src') } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }, [])

  function nodeNameToViewMode(name: string): ViewMode {
    if (name.includes('简历分析')) return ViewMode.Job
    if (name.toLowerCase().includes('ai') || name.includes('AI 面试') || name.includes('Al面试')) return ViewMode.InterviewPrepare
    if (name.includes('测试任务') || name.includes('第一轮测试任务') || name.includes('第二轮测试任务')) return ViewMode.TrailTask
    if (name.includes('学历验证')) return ViewMode.EducationEval
    return ViewMode.Job
  }

  function resolveViewModeFromProgress(): ViewMode | null {
    const nodes = progressNodes ?? []
    if (nodes.length === 0) return null
    // 全部节点均为已通过（30）→ 进入最终完成状态
    const allApproved = nodes.every((n) => n.node_status === JobApplyNodeStatus.Approved)
    if (allApproved) return ViewMode.AllApproved
    // 特殊规则：AI 面试 且状态=20（已完成待审核）
    const aiPending = nodes.find((n) => n.node_name.includes('AI 面试') && [JobApplyNodeStatus.CompletedPendingReview].includes(n.node_status) )
    if (aiPending) return ViewMode.InterviewPendingReview
    // AI 面试 且状态=40（不通过）
    const aiRejected = nodes.find((n) => n.node_name.includes('AI 面试') && n.node_status === JobApplyNodeStatus.Rejected)
    if (aiRejected) return ViewMode.Rejected
    // 优先进行中，其次未开始，否则取最后一个已完成相关节点
    const inProgress = nodes.find((n) => n.node_status === JobApplyNodeStatus.InProgress)
    if (inProgress) return nodeNameToViewMode(inProgress.node_name)
    const notStarted = nodes.find((n) => n.node_status === JobApplyNodeStatus.NotStarted)
    if (notStarted) return nodeNameToViewMode(notStarted.node_name)
    const completedIdx = nodes
      .map((n, idx) => ({ n, idx }))
      .filter(({ n }) => (
        n.node_status === JobApplyNodeStatus.Approved ||
        n.node_status === JobApplyNodeStatus.Rejected
      ))
      .map(({ idx }) => idx)
      .pop()
    if (completedIdx !== undefined) return nodeNameToViewMode(nodes[completedIdx].node_name)
    return nodeNameToViewMode(nodes[0].node_name)
  }

  // (removed) Audio output check – not used

  const { data: job, isLoading } = useJobDetailQuery(jobId ?? null, Boolean(jobId))

  // 进入页面（ViewMode=Job）即尝试获取用户简历，并进行回显
  useEffect(() => {
    let mounted = true
    if (viewMode === ViewMode.Job) {
      fetchTalentResumeDetail().then((res) => {
        if (!mounted) return
        const si = (res.item?.backend?.struct_info ?? null) as StructInfo | null
        if (si && (si.basic_info || si.experience)) {
          const mapped = mapStructInfoToResumeFormValues(si)
          setResumeValues(mapped)
        }
      })
    }
    return () => {
      mounted = false
    }
  }, [viewMode])

  // 根据进度切换视图
  useEffect(() => {
    const next = resolveViewModeFromProgress()
    if (next && next !== viewMode) {
      setViewMode(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressNodes])

  const handleApplyJob = useCallback(async () => {
    if (!jobId || isSkipConfirm) return
    try {
      const tokenToUse = inviteToken ||
        (await generateInviteToken({ job_id: jobId, token_type: InviteTokenType.ActiveApply }))

      if (!tokenToUse) {
        throw new Error('生成申请令牌失败')
      }

      const id = await applyJob(jobId, tokenToUse)
      if (id !== null) setJobApplyId(id)
    } catch (error) {
      handleServerError(error)
    }
  }, [jobId, inviteToken, isSkipConfirm])

  useEffect(() => {
    if(!user) return
    if(!user?.is_onboard){
      navigate({
        to: '/invited',
        search: { job_id: jobId, inviteToken: inviteToken },
        replace: true,
      })
      return
    }
    handleApplyJob();
  }, [user, jobId, inviteToken, navigate, handleApplyJob])

  // Auto-select first available camera when none is selected
  const firstCamId = cam.devices?.[0]?.deviceId
  const triedCamAutoRef = useRef(false)
  useEffect(() => {
    if (viewMode !== ViewMode.InterviewPrepare) return
    if (triedCamAutoRef.current) return
    // 优先使用本地存储的摄像头ID，否则回退为第一个可用设备
    const preferredCam = getPreferredDeviceId('videoinput')
    const targetId = preferredCam || firstCamId
    if (!cam.activeDeviceId && targetId) {
      triedCamAutoRef.current = true
      cam.setActiveMediaDevice(targetId)
      if (targetId) void setPreferredDeviceIdSmart('videoinput', targetId, cam.devices)
      setCameraStatus(DeviceTestStatus.Testing)
    }
  }, [viewMode, cam, firstCamId])

  // 在进度返回之前展示 Loading
  const isWorkflowLoading = !jobApplyId || isProgressLoading
  if (isWorkflowLoading) {
    return (
      <>
        <Main fixed>
          <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
            <div className='rounded-lg border bg-background p-3 shadow flex items-center gap-2 text-sm text-muted-foreground'>
              <IconLoader2 className='h-4 w-4 animate-spin text-primary' /> 正在加载流程…
            </div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Main fixed>
        {/* 顶部工具栏：返回 + 寻求支持 */}
        <div className={cn('flex items-center justify-between mb-2 w-full max-w-screen-xl mx-auto')}>
          <div className='flex items-center'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => {
                // 先主动释放媒体资源，再进行跳转
                releaseAllMediaStreams()
                if (viewMode === ViewMode.InterviewPendingReview) {
                  // 使用原生 API 替换跳转，便于更好地释放设备权限（摄像头/麦克风）
                  window.location.replace('/home')
                } else {
                  // 其它情况：回到上一页（保留 SPA 路由栈体验）
                  window.history.back()
                }
              }}
              aria-label='返回'
              className='cursor-pointer flex items-center gap-2'
            >
              <IconArrowLeft className='h-6 w-6 text-muted-foreground' />返回
            </Button>
          </div>
          <div className='flex items-center'>
            <Button variant='link' className='text-primary' onClick={() => setSupportOpen(true)}>寻求支持</Button>
          </div>
        </div>

        {/* ViewMode.Job
            职位与简历上传阶段：
            - 左侧展示职位基本信息与描述
            - 右侧提供简历上传与回显，确认后进入面试准备
        */}
        {viewMode === ViewMode.Job && (
          <div className='flex-1 flex flex-row items-stretch w-full justify-between max-w-screen-xl mx-auto overflow-hidden min-h-0'>
            {/* 左：职位信息 */}
            <div className='col-span-7 space-y-6 pl-3 flex flex-col h-full min-h-0 max-h-[600px] overflow-y-auto my-auto w-full '>
              <div className='flex h-full flex-col min-h-0'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0'>
                    <div className='text-2xl font-bold mb-2 leading-tight truncate'>{job?.title ?? (isLoading ? '加载中…' : '未找到职位')}</div>
                    <div className='flex items-center gap-4 text-primary mb-2'>
                      <div className='flex items-center'>
                        <IconBriefcase className='h-4 w-4 mr-1' />
                        <span className='text-[14px]'>时薪制</span>
                      </div>
                      <div className='flex items-center'>
                        <IconWorldPin className='h-4 w-4 mr-1' />
                        <span className='text-[14px]'>远程</span>
                      </div>
                    </div>
                  </div>
                  <div className='hidden md:flex flex-col items-end min-w-[140px]'>
                    <div className='text-xl font-semibold text-foreground mb-1'>
                      {job ? `¥${job.salary_min ?? 0}~¥${job.salary_max ?? 0}` : '—'}
                    </div>
                    <div className='text-xs text-muted-foreground mb-3'>每小时</div>
                  </div>
                </div>
                <Separator className='mt-2' />
                {/* 发布者信息 */}
                <div className='flex items-center gap-3 py-4 border-b border-border'>
                  <div className='w-9 h-9 border-1 border-gray-200 rounded-full flex items-center justify-center overflow-hidden bg-white'>
                    <img src={'https://dnu-cdn.xpertiise.com/common/34af7d0c-7d83-421d-b8ed-8b636ac77bf3.png'} alt='meetchances' className='h-9 w-9 object-contain ml-[3px] mt-[1px]' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>由一面千识发布</span>
                    <span className='text-xs mt-[10px] text-muted-foreground'>meetchances.com</span>
                  </div>
                </div>
                <div className='flex-1 min-h-0 text-foreground/90 leading-relaxed text-sm md:text-base py-4 flex flex-col'>
                  {/* 限高 + 渐隐遮罩 */}
                  <div className='relative flex-1 min-h-0 overflow-hidden'>
                    <div className='h-full overflow-hidden'>
                      {job?.description ? (
                        <RichText content={job.description} />
                      ) : (
                        <div className='text-muted-foreground'>{isLoading ? '正在加载职位详情…' : '暂无职位描述'}</div>
                      )}
                    </div>
                    {/* 渐隐遮罩 */}
                    <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent' />
                  </div>
                  <div className='mt-4 text-center'>
                    <Button variant='outline' onClick={() => setDrawerOpen(true)}>查看更多</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右：上传简历 */}
            <div className='col-span-5 flex flex-col h-full min-h-0 justify-center'>
              <div className='p-4 sticky relative my-8 pl-[36px]'>
                <UploadArea
                  className='my-4 min-w-[420px]'
                  uploader={uploadTalentResume}
                  onUploadingChange={setUploadingResume}
                  onUploadComplete={(results) => {
                    const first = results.find((r) => r.success)
                    if (!first) return
                    const si = (first.backend?.struct_info ?? {}) as StructInfo
                    const mapped = mapStructInfoToResumeFormValues(si)
                    setResumeValues(mapped)
                    setUploadedThisVisit(true)
                  }}
                >
                  {resumeValues && !uploadingResume && (
                    <div className='mb-4 flex items-center justify-between rounded-md border p-3 min-w-[400px]'>
                      <div className='text-sm text-left'>
                        <div className='font-medium'>姓名：{resumeValues.name || '—'}</div>
                        <div className='text-muted-foreground mt-1'>电话：{resumeValues.phone || '—'}</div>
                      </div>
                      <Button size='sm' variant='outline' onClick={(e) => { e.stopPropagation(); setResumeOpen(true) }}>点击查看</Button>
                    </div>
                  )}

                  {resumeValues ? (
                    <Button size='sm' variant='secondary'>
                      <IconUpload className='h-4 w-4' />
                      更新简历
                    </Button>
                  ) : (
                    <Button size='sm' variant='secondary'>
                      <IconUpload className='h-4 w-4' />
                      上传简历
                    </Button>
                  )}
                                  {/* 解析后的基础信息 */}

                </UploadArea>



                <div className='my-4'>
                  <Button className='w-full' disabled={uploadingResume || !resumeValues} onClick={handleConfirmResumeClick}>
                    {uploadingResume ? '正在分析简历…' : '确认简历，下一步'}
                  </Button>
                </div>

                {/* 遮罩交给 UploadArea 内部处理，这里不再渲染 */}
              </div>
            </div>
          </div>)}

        {/* ViewMode.InterviewPrepare
            面试准备阶段：
            - 展示本地摄像头画面与三项设备（摄像头/耳机/麦克风）检测与选择
            - 设备均通过后可进入正式 AI 面试
        */}
        {viewMode === ViewMode.InterviewPrepare && (
          <div className='flex-1 grid gap-8 grid-cols-12 max-w-screen-xl mx-auto'>
            {/* 左：职位标题 + 设备检查 */}
            <div className='col-span-7 space-y-6 pl-3 flex flex-col justify-center'>
              <div className='flex items-center justify-between'>
                <div className='text-2xl font-bold mb-2 leading-tight truncate'>{job?.title ?? (isLoading ? '加载中…' : '未找到职位')}</div>
                <div className='ml-4 flex-shrink-0'><ConnectionQualityBarsStandalone /></div>
              </div>
              {/* 用户摄像头展示区域 */}
              <LocalCameraPreview
                stage={stage}
                onHeadphoneConfirm={() => {
                  setSpkStatus(DeviceTestStatus.Success)
                  setStage('mic')
                }}
                onStatusChange={setCameraStatus}
                deviceId={cam.activeDeviceId}
                onCameraDeviceResolved={(resolvedId) => {
                  if (resolvedId && resolvedId !== cam.activeDeviceId) {
                    cam.setActiveMediaDevice(resolvedId)
                  }
                }}
                onCameraConfirmed={() => {
                  setCameraStatus(DeviceTestStatus.Success)
                  setStage('headphone')
                }}
                onMicConfirmed={() => {
                  setMicStatus(DeviceTestStatus.Success)
                }}
                disableCameraConfirm={cameraStatus === DeviceTestStatus.Failed}
              />

              {/* 三个设备选择 + 状态 */}
              <DeviceSelectorsRow
                camActiveDeviceId={cam.activeDeviceId}
                camDevices={cam.devices}
                onCamChange={(v) => {
                  cam.setActiveMediaDevice(v)
                  if (v !== cam.activeDeviceId) {
                    setCameraStatus(DeviceTestStatus.Testing)
                  }
                }}
                cameraStatus={cameraStatus}
                micStatus={micStatus}
                spkStatus={spkStatus}
                onMicStatusChange={()=>{}}
                onSpkStatusChange={()=>{}}
              />
            </div>

            {/* 右：操作区域 */}
            <div className='col-span-5 p-6 sticky flex flex-col justify-center'>
              <div className='my-36'>
                <Button
                  disabled={
                    cameraStatus !== DeviceTestStatus.Success
                    || micStatus !== DeviceTestStatus.Success
                    || spkStatus !== DeviceTestStatus.Success
                    || !interviewNodeId
                  }
                  className='w-full' onClick={async () => {
                    if (!interviewNodeId) return
                    navigate({ to: '/interview/session', search: { job_id: (jobId as string | number) || '', job_apply_id: jobApplyId ?? undefined, interview_node_id: interviewNodeId } })
                  }}>
                  确认设备，下一步
                </Button>
                <p className='text-xs text-muted-foreground mt-4'>请在安静、独立的空间进行本次AI面试，确保评估效果最佳</p>
              </div>
            </div>
          </div>

        )}

        {/* ViewMode.InterviewPendingReview
            AI 面试已完成，处于“已完成待审核”(20) 状态：
            - 展示审核中提示与说明
            - 可提供“重新面试”“寻求帮助”等操作入口
        */}
        {viewMode === ViewMode.InterviewPendingReview && (
          <div className='flex-1 grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-screen-xl mx-auto'>
            <div className='lg:col-span-12 flex flex-col items-center justify-center py-24'>
              <div className='w-36 rounded-2xl flex items-center justify-center mb-6'>
                <img src={searchPng} alt='' className='' />
              </div>
              <h2 className='text-2xl font-bold tracking-tight mb-2'>审核中</h2>
              <p className='text-muted-foreground text-center max-w-[560px]'>
                感谢您完成面试，我们正在审核您的材料，预计48小时内通知您，请等待通知
              </p>
              {interviewNodeStatus === JobApplyNodeStatus.CompletedPendingReview && (
                <div className='my-8'>
                  <Button onClick={() => setReinterviewOpen(true)}>重新面试</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ViewMode.TrailTask
            测试任务阶段（第一/第二轮）：
            - 占位区，后续将接入具体任务说明、提交入口与状态反馈
        */}
        {viewMode === ViewMode.TrailTask && (
          <div className='flex-1 grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-screen-xl mx-auto'>
            <div className='lg:col-span-7 space-y-6 pl-3'>
              <div className='text-2xl font-bold mb-2 leading-tight truncate'>测试任务</div>
              <p className='text-muted-foreground'>测试任务的具体指引将在此展示。</p>
            </div>
            <div className='lg:col-span-5 p-6 sticky flex flex-col justify-start'>
              <div className='my-36'>
                <Button className='w-full' disabled>
                  功能即将上线
                </Button>
                <p className='text-xs text-muted-foreground mt-4'>请稍后再试，或返回查看职位详情。</p>
              </div>
            </div>
          </div>
        )}

        {/* ViewMode.EducationEval
            学历验证阶段：
            - 占位区，后续将接入学历验证流程（材料上传、验证结果等）
        */}
        {viewMode === ViewMode.EducationEval && (
          <div className='flex-1 grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-screen-xl mx-auto'>
            <div className='lg:col-span-7 space-y-6 pl-3'>
              <div className='text-2xl font-bold mb-2 leading-tight truncate'>学历验证</div>
              <p className='text-muted-foreground'>学历验证相关内容将在此展示。</p>
            </div>
            <div className='lg:col-span-5 p-6 sticky flex flex-col justify-start'>
              <div className='my-36'>
                <Button className='w-full' disabled>
                  功能即将上线
                </Button>
                <p className='text-xs text-muted-foreground mt-4'>请稍后再试，或返回查看职位详情。</p>
              </div>
            </div>
          </div>
        )}

        {/* ViewMode.AllApproved
            所有流程节点均为 30（通过）：
            - 仅展示祝贺与下一步提示文案，居中显示
        */}
        {viewMode === ViewMode.AllApproved && (
          <div className='flex-1 flex items-center justify-center min-h-[60vh]'>
            <div className='text-center whitespace-pre-line text-xl font-semibold leading-relaxed text-foreground'>
              {`恭喜你,你已通过本次筛选\n我们会尽快告知下一步`}
            </div>
          </div>
        )}

        {/* ViewMode.Rejected
            AI 面试节点状态为 40（不通过）：
            - 展示拒绝提示文案，纵向横向居中
        */}
        {viewMode === ViewMode.Rejected && (
          <div className='flex-1 flex items-center justify-center min-h-[60vh]'>
            <div className='text-center whitespace-pre-line text-xl font-semibold leading-relaxed text-foreground'>
              {`您没有通过项目筛选。\n感谢您的参与，欢迎申请其他岗位。`}
            </div>
          </div>
        )}

        {/* 底部步骤与下一步 */}
        <Steps jobApplyId={jobApplyId ?? null} />

      </Main>
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      {/* 确认弹窗 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-left'>
            <DialogTitle>确认继续</DialogTitle>
            <DialogDescription>更新简历之后将覆盖您的旧简历，是否继续？</DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' className='mr-4' onClick={() => setConfirmOpen(false)}>放弃</Button>
            <Button onClick={async () => {
              setConfirmOpen(false)
              await proceedAfterResumeConfirm()
            }}>继续</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-Interview Dialog: 重新面试 */}
      <Dialog open={reinterviewOpen} onOpenChange={setReinterviewOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-left'>
            <DialogTitle>重新面试</DialogTitle>
            <DialogDescription>重新面试会导致您此前的面试记录被清除</DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>请选择您想要重新面试的原因</label>
            <Select value={reinterviewReason} onValueChange={(v) => setReinterviewReason(v)}>
              <SelectTrigger className='h-9 min-w-72'>
                <SelectValue placeholder='请选择一个原因' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='performance' description='我没有拿出最好的状态，想再试一次'>提升表现</SelectItem>
                <SelectItem value='tech-issue' description='由于一面千识的技术问题，我无法继续面试'>技术问题</SelectItem>
                <SelectItem value='disturbance' description='我在面试过程中收到干扰或者不得已提早结束'>受到干扰</SelectItem>
                <SelectItem value='just-testing' description='我刚才只是测试，现在我想认真面一次'>只是测试</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button disabled={!reinterviewReason} onClick={async () => {
              setReinterviewOpen(false)
              if (interviewNodeId != null) {
                await postNodeAction({ 
                  node_id: interviewNodeId, 
                  trigger: NodeActionTrigger.Retake, 
                  result_data: {}
                })
                location.reload()
                // navigate({ to: '/interview/session', search: { job_id: (jobId as string | number) || '', job_apply_id: jobApplyId ?? undefined, interview_node_id: interviewNodeId } })
              }
            }}>重新面试</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 右侧抽屉：职位详情 */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className='flex flex-col px-4 md:px-5 w-full sm:max-w-none md:w-[85vw] lg:w-[60vw] xl:w-[50vw]'>
          <SheetTitle className='sr-only'>职位详情</SheetTitle>
          {job && (
            <>
              {/* 可滚动内容 */}
              <div className={cn('flex-1 overflow-y-auto no-scrollbar ', isMobile ? 'mx-[8px]' : 'mx-[16px]' )}>
                {/* 标题与薪资区 */}
                <div className='flex pt-5 mt-5 pb-5 items-start justify-between border-b border-border'>
                  <div className='flex-1 min-w-0'>
                    <div className='text-2xl font-bold mb-2 leading-tight truncate text-foreground'>
                      {job.title}
                    </div>
                    <div className='flex items-center gap-4 text-primary mb-2'>
                      <div className='flex items-center'>
                        <IconBriefcase className='h-4 w-4 mr-1' />
                        <span className='text-[14px]'>时薪制</span>
                      </div>
                      <div className='flex items-center'>
                        <IconWorldPin className='h-4 w-4 mr-1' />
                        <span className='text-[14px]'>远程</span>
                      </div>
                    </div>
                  </div>
                  <div className='hidden md:flex flex-col items-end min-w-[140px]'>
                    <div className='text-xl font-semibold text-foreground mb-1'>
                      ¥{job.salary_min ?? 0}~¥{job.salary_max ?? 0}
                    </div>
                    <div className='text-xs text-muted-foreground mb-3'>每小时</div>
                  </div>
                </div>

                {/* 发布者信息 */}
                <div className='flex items-center gap-3 py-4 border-b bord er-border'>
                  <div className='w-9 h-9 border-1 border-gray-200 rounded-full flex items-center justify-center overflow-hidden bg-white'>
                    <img src={'https://dnu-cdn.xpertiise.com/common/34af7d0c-7d83-421d-b8ed-8b636ac77bf3.png'} alt='meetchances' className='h-9 w-9 object-contain ml-[3px] mt-[1px]' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>由一面千识发布</span>
                    <span className='text-xs mt-[10px] text-muted-foreground'>meetchances.com</span>
                  </div>
                </div>

                {/* 详情描述 */}
                <div className='py-6 text-foreground/90 text-base leading-relaxed'>
                  <RichText content={job.description || ''} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 悬浮客服按钮（固定在右下角） */}
      <div className='fixed bottom-[104px] right-6 z-50 group'>
        <button
          type='button'
          aria-label='联系客服'
          onClick={() => setSupportOpen(true)}
          className='h-12 w-12 rounded-full bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center hover:shadow-xl transition-shadow'
        >
          <svg viewBox='0 0 1024 1024' className='h-6 w-6 fill-current text-muted-foreground group-hover:text-primary transition-colors'>
            <path d='M966.5 345.4c-30.3-91.7-89.1-173.9-166.6-232.4-83.5-63-183-96.3-287.9-96.3S307.6 50 224.1 113C146.6 171.4 87.8 253.6 57.5 345.4c-34 13-57.5 46-57.5 83.1v133.6c0 41.7 29.6 78.3 70.4 87 6.2 1.3 12.4 2 18.6 2 49.1 0 89-39.9 89-89V428.5c0-43.2-31-79.3-71.9-87.3 63.3-166.2 226-280 405.8-280s342.5 113.7 405.8 280c-40.9 8-71.9 44.1-71.9 87.3v133.6c0 39 25.2 72.1 60.2 84.1C847.8 772.1 732.3 863 596.3 889.8c-11.8-35.5-45.1-60.7-84.3-60.7-49.1 0-89 39.9-89 89s39.9 89 89 89c43.5 0 79.7-31.4 87.5-72.7 158.1-29.2 291.6-136.8 353.9-285.5h0.2c40.8-8.8 70.4-45.4 70.4-87V428.5c0-37.1-23.5-70.1-57.5-83.1z m-832.9 83.1v133.6c0 24.6-20 44.5-44.5 44.5-3.1 0-6.2-0.3-9.3-1-20.4-4.4-35.2-22.7-35.2-43.5V428.5c0-20.8 14.8-39.1 35.2-43.5 3.1-0.7 6.2-1 9.3-1 24.5 0 44.5 20 44.5 44.5zM512 962.8c-24.5 0-44.5-20-44.5-44.5s20-44.5 44.5-44.5c23.9 0 43.4 18.8 44.4 42.7 0 0.6 0.1 1.1 0.1 1.8 0 24.5-20 44.5-44.5 44.5z m467.5-400.7c0 20.8-14.8 39.1-35.2 43.5-2.2 0.5-4.6 0.8-7.5 0.9-0.6 0-1.2 0.1-1.8 0.1-24.5 0-44.5-20-44.5-44.5V428.5c0-24.5 20-44.5 44.5-44.5 3.1 0 6.2 0.3 9.3 1 20.4 4.4 35.2 22.7 35.2 43.5v133.6z' />
            <path d='M682.7 656.6c9.2-8.2 9.9-22.3 1.7-31.4-8.2-9.2-22.3-9.9-31.4-1.7-149.1 133.5-275.2 6.9-280.7 1.2-8.5-8.9-22.6-9.2-31.5-0.7-8.9 8.5-9.2 22.6-0.7 31.5 1.1 1.1 72.2 73.6 173.3 73.6 50.6-0.1 108.7-18.3 169.3-72.5z' />
          </svg>
        </button>
        {/* 悬停展示的提示图片 */}
        <img
          src={'https://dnu-cdn.xpertiise.com/common/cb31d746-033b-45a0-92a7-63f89c8c169d.png'}
          alt='客服说明'
          className='pointer-events-none absolute right-16 bottom-0 mb-1 w-[60px] max-w-none rounded bg-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-transform duration-300 origin-bottom-right scale-100 group-hover:scale-[4]'
        />
      </div>

      {/* Drawer: 简历预览 */}
      <Sheet open={resumeOpen} onOpenChange={setResumeOpen}>
        <SheetContent className='flex w-full sm:max-w-none md:w-[85vw] lg:w-[60vw] xl:w-[50vw] flex-col px-4 md:px-5'>
          <SheetTitle className='sr-only'>简历预览</SheetTitle>
          <div className='flex pt-2 pb-2'>
            <div className='text-2xl font-semibold'>{resumeValues?.name ?? '简历预览'}</div>
          </div>
          {resumeValues && (
            <TalentResumePreview
              values={resumeValues}
              readOnly={false}
              onSave={async (vals) => {
                setResumeValues(vals)
                const struct = mapResumeFormValuesToStructInfo(vals)
                await patchTalentResumeDetail(struct as unknown as StructInfo)
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

