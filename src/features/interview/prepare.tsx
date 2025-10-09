import { Main } from '@/components/layout/main'
import { RichText } from '@/components/ui/rich-text'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { applyJob, generateInviteToken, InviteTokenType, useJobDetailQuery } from '@/features/jobs/api'
import { IconBriefcase, IconWorldPin, IconVideo, IconVolume, IconMicrophone, IconCircleCheckFilled } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { IconLoader2 } from '@tabler/icons-react'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
// import { cn } from '@/lib/utils'
import { SelectDropdown } from '@/components/select-dropdown'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMediaDeviceSelect } from '@livekit/components-react'
import { DeviceTestStatus } from '@/types/device'
import { fetchTalentResumeDetail } from '@/features/resume-upload/utils/api'
import TalentResumePreview from '@/features/talent-pool/components/talent-resume-preview'
import { resumeSchema, type ResumeFormValues } from '@/features/resume/data/schema'
import { mapStructInfoToResumeFormValues, mapResumeFormValuesToStructInfo } from '@/features/resume/data/struct-mapper'
import type { StructInfo } from '@/features/resume-upload/types/struct-info'
import { patchTalentResumeDetail } from '@/features/resume-upload/utils/api'
import { handleServerError } from '@/utils/handle-server-error'
import { useAuthStore } from '@/stores/authStore'
import { confirmResume, useJobApplyWorkflow, postNodeAction, NodeActionTrigger, getInterviewNodeId, getRtcConnectionInfo } from '@/features/interview/api'
import { useRoomStore } from '@/stores/interview/room'
import { Steps } from '@/features/interview/components/steps'
import { useJobApplyProgress, JobApplyNodeStatus } from '@/features/interview/api'
import searchPng from '@/assets/images/search.png'
import { ViewModeJob } from '@/features/interview/components/view-mode-job'
import { ViewModeInterviewPrepare } from '@/features/interview/components/view-mode-interview-prepare'
import { InterviewPrepareNav } from '@/features/interview/components/interview-prepare-nav'
import { getPreferredDeviceId, setPreferredDeviceIdSmart, clearAllPreferredDevices } from '@/lib/devices'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { userEvent, reportSessionPageRefresh } from '@/lib/apm'
import { useJoin } from '@/features/interview/session-view-page/lib/useCommon'
import { AnnotateTestInProgress as ViewModeAnnotateTestInProgress } from '@/features/interview/components/view-mode-annotate-test-in-progress'
import QuestionnaireCollection from './components/questionnaire-collection'
import PublisherSection from '@/features/jobs/components/publisher-section'

interface InterviewPreparePageProps {
  jobId?: string | number
  inviteToken?: string
  isSkipConfirm?: boolean
  jobApplyIdFromRoute?: string | number
  isFromSessionRefresh?: boolean
}

enum ViewMode {
  Job = 'job',
  InterviewPrepare = 'interview-prepare',
  InterviewPendingReview = 'interview-pending-review',
  EducationEval = 'education-eval',
  AllApproved = 'all-approved',
  AnnotateTestInProgress = 'annotate-test-in-progress',
  AnnotateTestReview = 'annotate-test-review',
  AnnotateTestRejected = 'annotate-test-rejected',
  Rejected = 'rejected',
  Questionnaire = 'questionnaire',
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
    onSpkDeviceChange,
    onMicDeviceChange,
  }: {
    camActiveDeviceId?: string
    camDevices: Array<{ deviceId: string; label: string }>
    onCamChange: (id: string) => void
    cameraStatus: DeviceTestStatus
    micStatus: DeviceTestStatus
    spkStatus: DeviceTestStatus
    onMicStatusChange: (_s: DeviceTestStatus) => void
    onSpkStatusChange: (_s: DeviceTestStatus) => void
    onSpkDeviceChange?: (deviceId: string) => void
    onMicDeviceChange?: (deviceId: string) => void
  }) {
    const mic = useMediaDeviceSelect({ kind: 'audioinput', requestPermissions: true })
    const spk = useMediaDeviceSelect({ kind: 'audiooutput', requestPermissions: true })

    // 用于显示的扬声器设备ID，当设备切换失败时保持用户选择的值
    const [displaySpkDeviceId, setDisplaySpkDeviceId] = useState<string>('')

    // 首次挂载时，应用本地存储的设备偏好
    useEffect(() => {
      const preferredMic = getPreferredDeviceId('audioinput')
      if (preferredMic && preferredMic !== mic.activeDeviceId) {
        mic.setActiveMediaDevice(preferredMic)
      }
      const preferredSpk = getPreferredDeviceId('audiooutput')
      if (preferredSpk && preferredSpk !== spk.activeDeviceId) {
        // 设置显示值为首选设备
        setDisplaySpkDeviceId(preferredSpk)
        spk.setActiveMediaDevice(preferredSpk).then(() => {
          // 初始化成功，通知父组件
          onSpkDeviceChange?.(preferredSpk)
        }).catch(() => {
          // 初始化失败时，显示值保持为首选设备ID
        })
      } else if (spk.activeDeviceId) {
        // 如果没有首选设备但已有活跃设备，使用活跃设备
        setDisplaySpkDeviceId(spk.activeDeviceId)
        onSpkDeviceChange?.(spk.activeDeviceId)
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
      if (!preferredSpk && spk.activeDeviceId && spk.devices.length > 0) {
        void setPreferredDeviceIdSmart('audiooutput', spk.activeDeviceId, spk.devices).then(() => {
          if (!displaySpkDeviceId) {
            setDisplaySpkDeviceId(getPreferredDeviceId('audiooutput') || '')
          }
        })
      }
    }, [spk.activeDeviceId, spk.devices, displaySpkDeviceId])

    // 当扬声器设备初始化完成时，通知父组件
    useEffect(() => {
      if (spk.activeDeviceId && displaySpkDeviceId) {
        onSpkDeviceChange?.(displaySpkDeviceId)
      }
    }, [spk.activeDeviceId, displaySpkDeviceId, onSpkDeviceChange])

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
              value={displaySpkDeviceId}
              onValueChange={(v) => {
                // 立即更新显示值
                setDisplaySpkDeviceId(v)

                spk.setActiveMediaDevice(v).then(async () => {
                  void setPreferredDeviceIdSmart('audiooutput', v, spk.devices)
                  onSpkStatusChange(DeviceTestStatus.Testing)

                  // 通知父组件扬声器设备已切换，让它更新音频元素的sinkId
                  onSpkDeviceChange?.(v)

                  // 给一些时间让音频元素更新sinkId
                  setTimeout(() => onSpkStatusChange(DeviceTestStatus.Success), 500)
                }).catch(() => {
                  // 设备切换失败
                })
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
                mic.setActiveMediaDevice(v).then(() => {
                  void setPreferredDeviceIdSmart('audioinput', v, mic.devices)
                  onMicStatusChange(DeviceTestStatus.Testing)

                  // 通知父组件麦克风设备已切换
                  onMicDeviceChange?.(v)

                  setTimeout(() => onMicStatusChange(DeviceTestStatus.Success), 500)
                }).catch(() => {
                  // 设备切换失败
                })
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

export default function InterviewPreparePage({ jobId, inviteToken, isSkipConfirm = false, jobApplyIdFromRoute, isFromSessionRefresh = false }: InterviewPreparePageProps) {
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reinterviewOpen, setReinterviewOpen] = useState(false)
  const [reinterviewReason, setReinterviewReason] = useState<string>('')
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadedThisVisit, setUploadedThisVisit] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeValues, setResumeValues] = useState<ResumeFormValues | null>(null)
  const [resumeFocusField, setResumeFocusField] = useState<string | undefined>(undefined)
  const [hadResumeBefore, setHadResumeBefore] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Job)
  const [cameraStatus, setCameraStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [showServiceTip, setShowServiceTip] = useState(false)
  const [micStatus, setMicStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [spkStatus, setSpkStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [stage, setStage] = useState<'headphone' | 'mic' | 'camera'>('camera')
  const [jobApplyId, setJobApplyId] = useState<number | string | null>(jobApplyIdFromRoute ?? null)
  const [currentSpkDeviceId, setCurrentSpkDeviceId] = useState<string>('')
  const [currentMicDeviceId, setCurrentMicDeviceId] = useState<string>('')
  const [currentNodeData, setCurrentNodeData] = useState<Record<string, unknown> | null>(null)
  const cam = useMediaDeviceSelect({ kind: 'videoinput', requestPermissions: viewMode === ViewMode.InterviewPrepare })
  const [_joining, triggerJoin] = useJoin()
  const setRtcConnectionInfo = useRoomStore((s) => s.setRtcConnectionInfo)
  // 当视频设备自动选择时，保存为默认选择
  useEffect(() => {
    if (viewMode !== ViewMode.InterviewPrepare) return
    const preferred = getPreferredDeviceId('videoinput')
    if (!preferred && cam.activeDeviceId) {
      void setPreferredDeviceIdSmart('videoinput', cam.activeDeviceId, cam.devices)
    }
  }, [viewMode, cam.activeDeviceId, cam.devices])
  const user = useAuthStore((s) => s.auth.user)
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const { data: progress, isLoading: isProgressLoading, refetch: refetchProgress } = useJobApplyProgress(jobApplyId ?? null, Boolean(jobApplyId))
  const { data: workflow } = useJobApplyWorkflow(jobApplyId ?? null, Boolean(jobApplyId))
  const interviewNodeId = useMemo(() => getInterviewNodeId(workflow), [workflow])
  const interviewNodeStatus = useMemo(() => {
    const nodes = progress?.nodes ?? []
    const ai = nodes.find((n) => n.node_name.includes('AI 面试'))
    return ai?.node_status
  }, [progress])

  const { data: job, isLoading } = useJobDetailQuery(jobId ?? null, Boolean(jobId))

  // 判断是否为模拟面试
  const isMock = useMemo(() => job?.job_type === 'mock_job', [job])

  // 页面挂载时清除之前存储的设备偏好，防止设备被拔掉后出现问题
  useEffect(() => {
    clearAllPreferredDevices()
  }, [])

  const hasReportedSessionRefresh = useRef(false)

  // 当页面来源为 session 页面刷新时，上报页面刷新事件
  useEffect(() => {
    if (isFromSessionRefresh && !hasReportedSessionRefresh.current) {
      reportSessionPageRefresh()
      hasReportedSessionRefresh.current = true
    }
  }, [isFromSessionRefresh])

  // 统一的简历校验 + 打开抽屉并定位首个错误字段
  // const validateResumeAndOpenIfInvalid = useCallback((vals: ResumeFormValues): boolean => {
  //   const parsed = resumeSchema.safeParse(vals)
  //   if (!parsed.success) {
  //     const firstErr = parsed.error.issues?.[0]
  //     const pathStr = Array.isArray(firstErr?.path) && firstErr.path.length > 0 ? firstErr.path.join('.') : undefined
  //     setResumeFocusField(pathStr)
  //     setResumeOpen(true)
  //     return false
  //   }
  //   return true
  // }, [])

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
    }
    await refetchProgress()
    if (isMock) {
      setViewMode(ViewMode.InterviewPrepare)
    }
  }, [viewMode, jobApplyId, workflow, queryClient, refetchProgress, isMock])

  const handleConfirmResumeClick = useCallback(async () => {
    if (uploadingResume) return
    if (!resumeValues) return
    userEvent('resume_confirmed', '确认简历，下一步', { page: 'interview_prepare',isMock: isMock,job_apply_id: jobApplyId ?? undefined,job_id: jobId ?? undefined })
    // 先进行简历校验（与“保存更新”一致）。失败则打开抽屉并定位。
    const parsed = resumeSchema.safeParse(resumeValues)
    if (!parsed.success) {
      const firstErr = parsed.error.issues[0]
      const pathStr = Array.isArray(firstErr?.path) && firstErr.path.length > 0 ? firstErr.path.join('.') : undefined
      setResumeFocusField(pathStr)
      setResumeOpen(true)
      return
    }
    if (uploadedThisVisit && hadResumeBefore) {
      setConfirmOpen(true)
      return
    }
    await proceedAfterResumeConfirm()
  }, [uploadingResume, resumeValues, uploadedThisVisit, hadResumeBefore, proceedAfterResumeConfirm, jobApplyId, jobId, isMock])

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

  const handleBackClick = useCallback(() => {
    // 先主动释放媒体资源，再进行跳转
    releaseAllMediaStreams()
    let isNeedToHome = false
    try {
      const ref = document.referrer
      if (!ref) {
        isNeedToHome = true
      } else {
        try {
          const refOrigin = new URL(ref).origin
          isNeedToHome = refOrigin !== window.location.origin && window.innerWidth > 699
        } catch {
          // ref 不是合法 URL，视为外部来源
          isNeedToHome = true
        }
      }
    } catch {
      /* ignore */
    }

    if (
      viewMode === ViewMode.InterviewPendingReview ||
      isNeedToHome || isFromSessionRefresh
    ) {
      // 使用原生 API 替换跳转，便于更好地释放设备权限（摄像头/麦克风）
      window.location.replace('/home')
    } else {
      // 其它情况：回到上一页（保留 SPA 路由栈体验）
      window.history.back()
    }
  }, [releaseAllMediaStreams, viewMode, isFromSessionRefresh])

  // 旧逻辑：页面初始化即加载 RTC 连接信息（已废弃，改为点击时加载）

  // 需求调整：不在初始化时加载 RTC 连接信息，改为点击时再加载
  /**
   * - session-view-page: interview_id=2181&job_id=2&job_apply_id=169&interview_node_id=795
   * - finish: ?interview_id=2181&job_id=2&job_apply_id=169&interview_node_id=795
  */
  // 新版面试间
  const onStartNewInterviewClick = async () => {
    if (!jobId || !interviewNodeId || connecting) return
    setConnecting(true)
    try {
      // 1) 点击时实时获取最新的 RTC 连接信息
      const info = await getRtcConnectionInfo({ job_id: Number(jobId ?? 0) })
      // 2) 写入全局 store，并持久化到 localStorage，避免依赖异步 state 读取旧值
      setRtcConnectionInfo(info)
      localStorage.setItem(`rtc_connection_info:v1:${info.interview_id}`, JSON.stringify(info))
      // 3) 加入房间
      await triggerJoin()
      // 4) 使用刚拿到的 info 进行跳转，避免读取尚未更新的 store
      navigate({
        to: '/interview/session_view',
        search: {
          interview_id: info.interview_id,
          job_id: jobId ?? undefined,
          job_apply_id: jobApplyId ?? undefined,
          interview_node_id: interviewNodeId ?? undefined,
          room_id: info.room_id,
        } as unknown as Record<string, unknown>,
      })
    } catch (_e) {
      toast.error('获取面试连接信息失败，请稍后重试', { position: 'top-center' })
      setConnecting(false)
    }
  }

  function currentNodeNameToViewMode(name: string, nodeStatus?: JobApplyNodeStatus | string): ViewMode {
    if (name.includes('简历分析')) return ViewMode.Job
    if (name.toLowerCase().includes('ai') || name.includes('AI 面试') || name.includes('Al面试')) {
      if (nodeStatus === JobApplyNodeStatus.InProgress) {
        // AI 面试准备页面
        return ViewMode.InterviewPrepare
      } else if (nodeStatus === JobApplyNodeStatus.CompletedPendingReview) {
        // AI 面试审核页面
        return ViewMode.InterviewPendingReview
      } else if (nodeStatus === JobApplyNodeStatus.Rejected) {
        // AI 面试不通过页面
        return ViewMode.Rejected
      }
      return ViewMode.InterviewPrepare
    }
    if (name.includes('测试任务')) {
      if (nodeStatus === JobApplyNodeStatus.InProgress) {
        // 测试任务进行中页面
        return ViewMode.AnnotateTestInProgress
      } else if (Number(nodeStatus) === JobApplyNodeStatus.AnnotateCompleted || Number(nodeStatus) === JobApplyNodeStatus.CompletedPendingReview) {
        // 完成标注端标注，待Studio端审核
        return ViewMode.AnnotateTestReview
      } else if (Number(nodeStatus) === JobApplyNodeStatus.Rejected) {
        // 测试任务不通过页面
        return ViewMode.AnnotateTestRejected
      }
      return ViewMode.AnnotateTestInProgress
    }
    if (name.includes('学历验证')) return ViewMode.EducationEval
    if (name.includes('问卷收集')) return ViewMode.Questionnaire
    return ViewMode.Job
  }

  function resolveViewModeFromProgress(): ViewMode | null {
    const nodes = progress?.nodes ?? []
    const currentNodeId = progress?.current_node_id
    const currentNode = nodes.find((n) => n.id === currentNodeId)
    if (nodes.length === 0) return null
    // 全部节点均为已通过（30）→ 进入最终完成状态
    const allApproved = nodes.every((n) => n.node_status === JobApplyNodeStatus.Approved)
    if (allApproved) return ViewMode.AllApproved

    return currentNodeNameToViewMode(currentNode?.node_name ?? '', currentNode?.node_status)
  }

  // (removed) Audio output check – not used

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
          setHadResumeBefore(true)
        } else {
          setHadResumeBefore(false)
        }
      })
    }
    return () => {
      mounted = false
    }
  }, [viewMode, isMock])

  // 根据进度切换视图 + 问卷节点轮询
  useEffect(() => {
    // 1. 视图切换逻辑
    const next = resolveViewModeFromProgress()
    if (next && next !== viewMode && !isMock) {
      setViewMode(next)
    }

    // 2. 设置当前激活节点
    const activeNode = (progress?.nodes ?? []).find(
      (node) => node.node_status !== JobApplyNodeStatus.Approved
    )
    if (activeNode) {
      setCurrentNodeData(activeNode as unknown as Record<string, unknown>)
    }

    // 3. 问卷节点轮询：当问卷收集节点处于进行中时，定期刷新工作流状态
    const isQuestionnaireInProgress =
      activeNode?.node_name === '问卷收集' &&
      activeNode.node_status === JobApplyNodeStatus.InProgress &&
      !isMock

    if (isQuestionnaireInProgress) {
      const pollInterval = setInterval(async () => {
        // 刷新工作流数据，这会触发本 useEffect 重新执行
        await queryClient.invalidateQueries({
          queryKey: ['job-apply-workflow', jobApplyId],
        })
      }, 1300)

      return () => {
        clearInterval(pollInterval)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, isMock])

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
        <InterviewPrepareNav
          onBackClick={handleBackClick}
          onSupportClick={() => setSupportOpen(true)}
        />
        {isMobile && (
          <Steps jobApplyId={jobApplyId ?? null} isMock={isMock} />
        )}
        {/* ViewMode.Job
            职位与简历上传阶段：
            - 左侧展示职位基本信息与描述
            - 右侧提供简历上传与回显，确认后进入面试准备
        */}
        {viewMode === ViewMode.Job && (
          <ViewModeJob
            job={job}
            isLoading={isLoading}
            isMock={isMock}
            resumeValues={resumeValues}
            uploadingResume={uploadingResume}
            onDrawerOpen={() => setDrawerOpen(true)}
            onResumeOpen={() => setResumeOpen(true)}
            onUploadingChange={setUploadingResume}
            onUploadComplete={(results) => {
              userEvent('resume_uploaded', '简历上传', { page: 'interview_prepare',isMock: isMock, action: resumeValues ? 'update' : 'upload',job_id: jobId ?? undefined,job_apply_id: jobApplyId ?? undefined })
              const first = results.find((r) => r.success)
              if (!first) return
              const si = (first.backend?.struct_info ?? {}) as StructInfo
              const mapped = mapStructInfoToResumeFormValues(si)
              setResumeValues(mapped)
              setUploadedThisVisit(true)
              // 新简历解析后立即做校验；打开抽屉，失败则定位到首个错误
              userEvent('resume_parsed_success', '简历解析成功', {
                page: 'interview_prepare',
                name: mapped.name ?? '',
                isMock: isMock,
                phone: mapped.phone ?? '',
                email: mapped.email ?? '',
                education_count: String(mapped.education?.length ?? 0),
                work_count: String(mapped.workExperience?.length ?? 0),
                project_count: String(mapped.projectExperience?.length ?? 0),
                job_id: jobId ?? undefined,
                job_apply_id: jobApplyId ?? undefined,
              })
              const parsed = resumeSchema.safeParse(mapped)
              if (!parsed.success) {
                const firstErr = parsed.error.issues?.[0]
                const pathStr = Array.isArray(firstErr?.path) && firstErr.path.length > 0 ? firstErr.path.join('.') : undefined
                setResumeFocusField(pathStr)
              } else {
                setResumeFocusField(undefined)
              }
              setResumeOpen(true)
            }}
            onConfirmResumeClick={handleConfirmResumeClick}
            onUploadEvent={(action) => {
              userEvent('resume_uploaded', '简历上传', {
                page: 'interview_prepare',
                isMock: isMock,
                trigger: 'button_click',
                action,
                job_id: jobId ?? undefined,
                job_apply_id: jobApplyId ?? undefined
              })
            }}
          />
        )}

        {/* ViewMode.InterviewPrepare
            面试准备阶段：
            - 展示本地摄像头画面与三项设备（摄像头/耳机/麦克风）检测与选择
            - 设备均通过后可进入正式 AI 面试
        */}
        {viewMode === ViewMode.InterviewPrepare && (
          <ViewModeInterviewPrepare
            job={job}
            isLoading={isLoading}
            isMock={isMock}
            jobApplyId={jobApplyId}
            interviewNodeId={interviewNodeId ?? null}
            connecting={connecting}
            stage={stage}
            cameraStatus={cameraStatus}
            micStatus={micStatus}
            spkStatus={spkStatus}
            camActiveDeviceId={cam.activeDeviceId}
            camDevices={cam.devices}
            currentSpkDeviceId={currentSpkDeviceId}
            currentMicDeviceId={currentMicDeviceId}
            onStartNewInterviewClick={onStartNewInterviewClick}
            onSpkStatusChange={setSpkStatus}
            onMicStatusChange={setMicStatus}
            onCameraStatusChange={setCameraStatus}
            onStageChange={setStage}
            onCamChange={(v) => {
              cam.setActiveMediaDevice(v)
              if (v !== cam.activeDeviceId) {
                setCameraStatus(DeviceTestStatus.Testing)
              }
            }}
            onSpkDeviceChange={setCurrentSpkDeviceId}
            onMicDeviceChange={setCurrentMicDeviceId}
            onCameraDeviceResolved={(resolvedId) => {
              if (resolvedId && resolvedId !== cam.activeDeviceId) {
                cam.setActiveMediaDevice(resolvedId)
              }
            }}
            onCameraConfirmed={() => {
              setCameraStatus(DeviceTestStatus.Success)
              setStage('headphone')
              userEvent('camera_status_confirmed', '确认摄像头状态正常', {
                job_id: job?.id,
                isMock: isMock,
                job_apply_id: jobApplyId ?? undefined,
                interview_node_id: interviewNodeId ?? undefined,
              })
            }}
            onHeadphoneConfirm={() => {
              setSpkStatus(DeviceTestStatus.Success)
              setStage('mic')
              userEvent('speaker_status_confirmed', '确认扬声器状态正常', {
                job_id: job?.id,
                isMock: isMock,
                job_apply_id: jobApplyId ?? undefined,
                interview_node_id: interviewNodeId ?? undefined,
              })
            }}
            onMicConfirmed={() => {
              setMicStatus(DeviceTestStatus.Success)
              userEvent('microphone_status_confirmed', '确认麦克风状态正常', {
                job_id: job?.id,
                isMock: isMock,
                job_apply_id: jobApplyId ?? undefined,
                interview_node_id: interviewNodeId ?? undefined,
              })
            }}
            DeviceSelectorsRow={DeviceSelectorsRow}
          />
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
                感谢您完成面试，我们正在审核您的材料，请等待通知
              </p>
              <div className='flex items-center justify-center mt-5'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M5.83333 16.6667H9.16667C9.16667 17.5833 8.41667 18.3333 7.5 18.3333C6.58333 18.3333 5.83333 17.5833 5.83333 16.6667ZM4.16667 15.8333H10.8333V14.1667H4.16667V15.8333ZM13.75 7.91667C13.75 11.1 11.5333 12.8 10.6083 13.3333H4.39167C3.46667 12.8 1.25 11.1 1.25 7.91667C1.25 4.46667 4.05 1.66667 7.5 1.66667C10.95 1.66667 13.75 4.46667 13.75 7.91667ZM12.0833 7.91667C12.0833 5.39167 10.025 3.33333 7.5 3.33333C4.975 3.33333 2.91667 5.39167 2.91667 7.91667C2.91667 9.975 4.15833 11.1583 4.875 11.6667H10.125C10.8417 11.1583 12.0833 9.975 12.0833 7.91667ZM17.8083 6.14167L16.6667 6.66667L17.8083 7.19167L18.3333 8.33333L18.8583 7.19167L20 6.66667L18.8583 6.14167L18.3333 5L17.8083 6.14167ZM15.8333 5L16.6167 3.28333L18.3333 2.5L16.6167 1.71667L15.8333 0L15.05 1.71667L13.3333 2.5L15.05 3.28333L15.8333 5Z" fill="#4E02E4"/>
                </svg>
                <span className='ml-1 text-primary text-sm'>您可以离开当前页面啦</span>
              </div>
              {interviewNodeStatus === JobApplyNodeStatus.CompletedPendingReview && (
                <div className='flex gap-4 items-center justify-center'>
                  <div className='my-8'>
                    <Button onClick={() => setReinterviewOpen(true)}>重新面试</Button>
                  </div>
                  <div className='my-8'>
                    <Button variant='outline' onClick={() => navigate({ to: '/home' })}>回到首页</Button>
                  </div>
                </div>
              )}
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

        {/* ViewMode.AnnotateTestInProgress
            标注测试阶段：
            - 引导用户前往 Xpert Studio 完成标注测试任务
        */}
        {viewMode === ViewMode.AnnotateTestInProgress && (
          <ViewModeAnnotateTestInProgress
            nodeData={currentNodeData ?? undefined}
            jobApplyId={jobApplyId ?? null}
            onTaskSubmit={async () => {
              if (currentNodeData && currentNodeData.id) {
                const nodeId = currentNodeData.id as number
                await postNodeAction({ node_id: nodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
                await refetchProgress()
              }
            }}
          />
        )} 

        {/* ViewMode.AnnotateTestReview
            标注测试通过阶段：
            - 展示标注测试通过提示文案，居中显示
        */}
        {viewMode === ViewMode.AnnotateTestReview && (
          <div className='flex-1 flex items-center justify-center min-h-[60vh]'>
            <div className='flex flex-col items-center'>
              <img src="https://dnu-cdn.xpertiise.com/design-assets/logo-and-text-no-padding.svg" alt='' className='mb-4 h-[50px]' />
              <div className='text-center whitespace-pre-line text-xl font-semibold leading-relaxed text-foreground'>
                {`已收到你提交的信息,请等待管理员审核`}
              </div>
            </div>
          </div>
        )}

        {/* ViewMode.AnnotateTestRejected
            标注测试不通过阶段：
            - 展示拒绝提示文案，居中显示
        */}
        {viewMode === ViewMode.AnnotateTestRejected && (
          <div className='flex-1 flex items-center justify-center min-h-[60vh]'>
            <div className='flex flex-col items-center'>
              <img src="https://dnu-cdn.xpertiise.com/design-assets/logo-and-text-no-padding.svg" alt='' className='mb-4 h-[50px]' />
              <div className='text-center text-xl font-semibold leading-relaxed text-foreground'>
                感谢你对本岗位的关注。此次评估未能进入下一步流程,可随时前往
                <a
                  href='/jobs'
                  className='mx-1 text-primary underline hover:text-primary'
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = '/jobs'
                  }}
                >
                  职位列表
                </a>
                查看当前在招职位,期待未来有机会合作
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

        {/* ViewMode.Questionnaire
            问卷收集阶段：
            - 展示飞书问卷并等待用户填写
        */}
        {viewMode === ViewMode.Questionnaire && (
          <div className='flex-1 w-full max-w-screen-xl mx-auto'>
            <QuestionnaireCollection nodeData={currentNodeData ?? undefined} />
          </div>
        )}

        {/* 底部步骤与下一步 */}
        {!isMobile && (
          <Steps jobApplyId={jobApplyId ?? null} isMock={isMock} />
        )}

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
                  result_data: { reason: reinterviewReason }
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
                    {
                      !isMock && (
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
                      )
                    }
                  </div>
                  {
                    !isMock && (
                      <div className='hidden md:flex flex-col items-end min-w-[140px]'>
                        <div className='text-xl font-semibold text-foreground mb-1'>
                          ¥{job.salary_min ?? 0}~¥{job.salary_max ?? 0}
                        </div>
                        <div className='text-xs text-muted-foreground mb-3'>每小时</div>
                      </div>
                    )
                  }

                </div>

                {/* 发布者信息 */}
                <PublisherSection job={job} />

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
          onClick={() => {
            setShowServiceTip((prev) => !prev)
            // setSupportOpen(true)
          }}
          className='h-[46px] w-[46px] rounded-full bg-white border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.18)] hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'
        >
          <svg viewBox='0 0 1024 1024' className='h-6 w-6 fill-current text-muted-foreground group-hover:text-primary transition-colors'>
            <path d='M966.5 345.4c-30.3-91.7-89.1-173.9-166.6-232.4-83.5-63-183-96.3-287.9-96.3S307.6 50 224.1 113C146.6 171.4 87.8 253.6 57.5 345.4c-34 13-57.5 46-57.5 83.1v133.6c0 41.7 29.6 78.3 70.4 87 6.2 1.3 12.4 2 18.6 2 49.1 0 89-39.9 89-89V428.5c0-43.2-31-79.3-71.9-87.3 63.3-166.2 226-280 405.8-280s342.5 113.7 405.8 280c-40.9 8-71.9 44.1-71.9 87.3v133.6c0 39 25.2 72.1 60.2 84.1C847.8 772.1 732.3 863 596.3 889.8c-11.8-35.5-45.1-60.7-84.3-60.7-49.1 0-89 39.9-89 89s39.9 89 89 89c43.5 0 79.7-31.4 87.5-72.7 158.1-29.2 291.6-136.8 353.9-285.5h0.2c40.8-8.8 70.4-45.4 70.4-87V428.5c0-37.1-23.5-70.1-57.5-83.1z m-832.9 83.1v133.6c0 24.6-20 44.5-44.5 44.5-3.1 0-6.2-0.3-9.3-1-20.4-4.4-35.2-22.7-35.2-43.5V428.5c0-20.8 14.8-39.1 35.2-43.5 3.1-0.7 6.2-1 9.3-1 24.5 0 44.5 20 44.5 44.5zM512 962.8c-24.5 0-44.5-20-44.5-44.5s20-44.5 44.5-44.5c23.9 0 43.4 18.8 44.4 42.7 0 0.6 0.1 1.1 0.1 1.8 0 24.5-20 44.5-44.5 44.5z m467.5-400.7c0 20.8-14.8 39.1-35.2 43.5-2.2 0.5-4.6 0.8-7.5 0.9-0.6 0-1.2 0.1-1.8 0.1-24.5 0-44.5-20-44.5-44.5V428.5c0-24.5 20-44.5 44.5-44.5 3.1 0 6.2 0.3 9.3 1 20.4 4.4 35.2 22.7 35.2 43.5v133.6z' />
            <path d='M682.7 656.6c9.2-8.2 9.9-22.3 1.7-31.4-8.2-9.2-22.3-9.9-31.4-1.7-149.1 133.5-275.2 6.9-280.7 1.2-8.5-8.9-22.6-9.2-31.5-0.7-8.9 8.5-9.2 22.6-0.7 31.5 1.1 1.1 72.2 73.6 173.3 73.6 50.6-0.1 108.7-18.3 169.3-72.5z' />
          </svg>
        </button>
        {/* 悬停展示的提示图片 */}
        <img
          src={'https://dnu-cdn.xpertiise.com/common/4c9d2d04-912e-4bde-ad30-af123145be94.jpeg'}
          alt='客服说明'
          onClick={() => setShowServiceTip(false)}
          className={cn(
            'absolute right-16 bottom-0 mb-1 w-[60px] max-w-none rounded bg-white shadow-xl transition-all duration-300 origin-bottom-right',
            showServiceTip
              ? 'opacity-100 translate-y-0 scale-[4] pointer-events-auto cursor-pointer'
              : 'pointer-events-none opacity-0 translate-y-2 scale-100 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-[4]'
          )}
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
              initialFocusField={resumeFocusField}
              onSave={async (vals) => {
                setResumeValues(vals)
                const struct = mapResumeFormValuesToStructInfo(vals)
                const res = await patchTalentResumeDetail(struct as unknown as StructInfo)
                if (res.success) {
                  userEvent('resume_save', '简历保存', {
                    page: 'interview_prepare',
                    isMock: isMock,
                    name: vals.name ?? '',
                    phone: vals.phone ?? '',
                    email: vals.email ?? '',
                    education_count: vals.education?.length ?? 0,
                    work_count: vals.workExperience?.length ?? 0,
                    project_count: vals.projectExperience?.length ?? 0,
                  })
                  toast.success('保存成功')
                  setResumeOpen(false)
                } else {
                  toast.error('保存失败')
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
