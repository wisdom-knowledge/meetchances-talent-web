import { Main } from '@/components/layout/main'
import { RichText } from '@/components/ui/rich-text'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { applyJob, generateInviteToken, InviteTokenType, useJobDetailQuery } from '@/features/jobs/api'
import { salaryTypeMapping, salaryTypeUnitMapping } from '@/features/jobs/constants'
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
import { SidebarProgress } from '@/features/interview/components/sidebar-progress'
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
          <div className='text-sm text-primary flex items-center gap-1'>
            <IconCircleCheckFilled className='h-5 w-5 text-primary' />
            测试完成
          </div>
        )
      }
      return <div className='text-sm text-muted-foreground'>{statusText(s)}</div>
    }

    return (
      <div className='grid grid-cols-1 gap-9 md:grid-cols-3'>

        {/* 摄像头选择 */}
        <div className='flex flex-col gap-2 '>
          <div className="flex items-center gap-1">
            <IconVideo className='h-5 w-5' />
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
          <div className='flex items-center gap-1'>
            <IconVolume className='h-5 w-5' />
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
          <div className='flex items-center gap-1'>
            <IconMicrophone className='h-5 w-5' />
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
  // 问卷轮询的最大次数，默认 100 次
  const MAX_QUESTIONNAIRE_POLL_COUNT = 100
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
  const questionnairePollCountRef = useRef(0)

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
      // 若已达到最大次数，则不再启动新的轮询
      if (questionnairePollCountRef.current >= MAX_QUESTIONNAIRE_POLL_COUNT) {
        return
      }

      const pollInterval = setInterval(async () => {
        // 已达上限则停止
        if (questionnairePollCountRef.current >= MAX_QUESTIONNAIRE_POLL_COUNT) {
          clearInterval(pollInterval)
          return
        }
        questionnairePollCountRef.current += 1
        // 刷新工作流数据，这会触发本 useEffect 重新执行
        await queryClient.invalidateQueries({
          queryKey: ['job-apply-workflow', jobApplyId],
        })
      }, 1300)

      return () => {
        clearInterval(pollInterval)
      }
    } else {
      // 非问卷阶段或已结束时，重置计数
      questionnairePollCountRef.current = 0
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

  // 内容区域组件（PC和移动端共享）
  const renderContent = () => (
    <>
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
            AI 面试已完成，处于"已完成待审核"(20) 状态：
            - 展示审核中提示与说明
            - 可提供"重新面试""退出"等操作入口
        */}
        {viewMode === ViewMode.InterviewPendingReview && (
          <div className='flex-1 flex items-center justify-center min-h-[calc(100vh-200px)]'>
            <div className='flex flex-col lg:flex-row items-center justify-center gap-16 max-w-6xl mx-auto px-8'>
              {/* 左侧内容 */}
              <div className='flex flex-col items-start max-w-md'>
                <h2 className='text-[32px] font-semibold tracking-tight mb-6 text-foreground'>审核中...</h2>
                <p className='text-foreground text-base leading-relaxed mb-6'>
                  感谢您完成面试，我们正在审核您的材料，<br />
                  预计48小时内通过以下方式向你反馈通知：
                </p>
                
                {/* 通知方式图标 */}
                <div className='flex items-center gap-6 mb-6'>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.486 2 2 5.589 2 10C2 12.908 3.898 15.516 7 16.934V22L12.34 17.995C17.697 17.852 22 14.32 22 10C22 5.589 17.514 2 12 2ZM12 16H11.667L9 18V15.583L8.359 15.336C5.67 14.301 4 12.256 4 10C4 6.691 7.589 4 12 4C16.411 4 20 6.691 20 10C20 13.309 16.411 16 12 16Z" fill="#4E02E4"/>
                      </svg>
                    </div>
                    <span className='text-xs text-foreground'>短信</span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M10.1459 3.24792C10.2953 2.87864 10.5516 2.56238 10.8819 2.3397C11.2122 2.11701 11.6015 1.99805 11.9999 1.99805C12.3983 1.99805 12.7876 2.11701 13.1179 2.3397C13.4482 2.56238 13.7045 2.87864 13.8539 3.24792C15.3329 3.65416 16.6376 4.53491 17.5673 5.75479C18.497 6.97467 19.0003 8.46614 18.9999 9.99992V14.6969L20.8319 17.4449C20.9324 17.5955 20.9901 17.7706 20.9989 17.9514C21.0077 18.1322 20.9672 18.3121 20.8818 18.4717C20.7964 18.6313 20.6692 18.7648 20.5139 18.8578C20.3586 18.9508 20.181 19 19.9999 18.9999H15.4649C15.3445 19.833 14.928 20.5949 14.2916 21.1459C13.6552 21.6969 12.8417 22.0001 11.9999 22.0001C11.1581 22.0001 10.3446 21.6969 9.7082 21.1459C9.07184 20.5949 8.65531 19.833 8.53491 18.9999H3.99991C3.81886 19 3.64121 18.9508 3.4859 18.8578C3.33058 18.7648 3.20344 18.6313 3.11803 18.4717C3.03262 18.3121 2.99215 18.1322 3.00093 17.9514C3.00972 17.7706 3.06743 17.5955 3.16791 17.4449L4.99991 14.6969V9.99992C4.99991 6.77592 7.17991 4.05992 10.1459 3.24792ZM10.5859 18.9999C10.6892 19.2926 10.8807 19.546 11.134 19.7252C11.3874 19.9045 11.6901 20.0007 12.0004 20.0007C12.3107 20.0007 12.6134 19.9045 12.8668 19.7252C13.1201 19.546 13.3116 19.2926 13.4149 18.9999H10.5859ZM11.9999 4.99992C10.6738 4.99992 9.40205 5.52671 8.46437 6.46439C7.52669 7.40207 6.99991 8.67384 6.99991 9.99992V14.9999C6.99995 15.1975 6.94149 15.3906 6.83191 15.5549L5.86891 16.9999H18.1299L17.1669 15.5549C17.0577 15.3905 16.9996 15.1974 16.9999 14.9999V9.99992C16.9999 8.67384 16.4731 7.40207 15.5354 6.46439C14.5978 5.52671 13.326 4.99992 11.9999 4.99992Z" fill="#4E02E4"/>
                      </svg>
                    </div>
                    <span className='text-xs text-foreground'>站内通知</span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M11.9351 2.4375C12.0578 2.43734 12.179 2.46468 12.2896 2.51758C12.3725 2.55724 12.4482 2.61038 12.5132 2.6748L12.5747 2.74316C13.5542 3.96462 14.2725 5.37302 14.688 6.88086C14.619 6.90526 14.55 6.92948 14.4819 6.95605C14.3119 7.02229 14.1452 7.09496 13.9819 7.17383C13.8082 7.25781 13.6385 7.34879 13.4731 7.44629C13.304 7.54596 13.1394 7.65268 12.98 7.76562C12.8663 7.84609 12.7553 7.92973 12.647 8.0166H12.646C12.5275 8.11166 12.4123 8.21114 12.3003 8.31348C12.2397 8.36886 12.1802 8.42584 12.1216 8.4834H12.1206L11.8228 8.77832L11.6089 8.98926L11.3755 9.21973L11.1519 9.44043L10.9146 9.67578L10.6372 9.94922L10.4331 10.1514L10.4292 10.1543C8.7135 7.14262 6.39758 4.51626 3.62354 2.4375H11.9351Z" fill="#4E02E4" stroke="#C994F7" strokeWidth="0.5"/>
                        <path d="M17.2921 12.033L17.2864 12.0431L17.2929 12.0333L17.3325 11.959C17.319 11.9836 17.3058 12.0084 17.2921 12.033Z" fill="#133C92"/>
                        <path d="M17.4768 11.6882L17.4874 11.6684L17.4924 11.6582L17.4768 11.6882Z" fill="#133C92"/>
                        <path d="M0.25 7.38379C2.24716 9.47995 4.59279 11.2147 7.18457 12.5078C7.2351 12.533 7.28626 12.5582 7.33691 12.583C7.39638 12.6122 7.45616 12.6413 7.51562 12.6699C7.57117 12.6966 7.62694 12.7228 7.68262 12.749C7.7359 12.7742 7.78998 12.7994 7.84375 12.8242L7.9707 12.8828C8.01125 12.9012 8.05257 12.9199 8.09375 12.9385C8.13438 12.9568 8.17551 12.9752 8.21582 12.9932C8.26 13.0127 8.30428 13.0324 8.34863 13.0518C8.39979 13.0741 8.4516 13.0962 8.50293 13.1182C8.55231 13.1394 8.60186 13.1608 8.65137 13.1816L8.84375 13.2617C8.89536 13.283 8.94726 13.3043 8.99902 13.3252C9.07857 13.3573 9.159 13.3894 9.23926 13.4209C9.31437 13.4504 9.39003 13.4789 9.46582 13.5078V13.5088L9.63672 13.5732C9.73461 13.6099 9.83329 13.6452 9.93164 13.6807C9.98123 13.6985 10.0313 13.7168 10.0811 13.7344C10.1504 13.7588 10.2202 13.7827 10.29 13.8066C10.3478 13.8265 10.4054 13.8469 10.4629 13.8662V13.8652C10.5473 13.8936 10.6321 13.9217 10.7168 13.9492C10.8055 13.9779 10.895 14.0063 10.9844 14.0342V14.0352C11.0934 14.0692 11.2035 14.102 11.3135 14.1348C11.3871 14.1568 11.4614 14.1789 11.5352 14.2002C11.6828 14.2429 11.8313 14.2839 11.9805 14.3242C12.0359 14.3392 12.0919 14.354 12.1475 14.3672C12.2528 14.3922 12.3581 14.4139 12.4629 14.4326L12.8242 14.4844C12.988 14.5023 13.1509 14.5131 13.3125 14.5156C13.4599 14.5179 13.606 14.5132 13.751 14.5029C13.889 14.4932 14.0258 14.478 14.1611 14.457C14.3478 14.4282 14.5327 14.3883 14.7148 14.3379C14.8368 14.304 14.9576 14.266 15.0762 14.2227C15.1856 14.1827 15.2933 14.1386 15.3994 14.0908C15.5201 14.0364 15.6382 13.9765 15.7539 13.9121C14.9275 14.8776 13.9445 15.705 12.8398 16.3545C11.0669 17.397 9.04699 17.9461 6.99023 17.9453C4.72253 17.9489 2.50376 17.2808 0.615234 16.0254C0.504043 15.9507 0.412623 15.8498 0.349609 15.7314C0.286471 15.6128 0.253597 15.4801 0.253906 15.3457V14.7305L0.25 7.38379Z" fill="#4E02E4" stroke="#C994F7" strokeWidth="0.5"/>
                        <path d="M15.2585 7.22266C16.6909 6.82104 18.2136 6.92265 19.5759 7.50293C19.105 8.02014 18.716 8.6072 18.4236 9.24414L17.3865 11.3115L17.2732 11.5371C17.1786 11.7184 17.0721 11.8939 16.9548 12.0615C16.9135 12.1205 16.8714 12.1782 16.8279 12.2344V12.2354L16.658 12.4414C16.6117 12.4944 16.5643 12.5458 16.5164 12.5957C16.4184 12.6976 16.3164 12.7942 16.2107 12.8848C16.1519 12.9351 16.0919 12.9836 16.031 13.0303C15.9596 13.0851 15.8866 13.1376 15.8123 13.1875H15.8113C15.7644 13.2189 15.717 13.2496 15.6687 13.2793C15.618 13.3104 15.5667 13.3405 15.5154 13.3691C15.4105 13.4276 15.3035 13.4819 15.1941 13.5312C15.0992 13.574 15.0028 13.6128 14.905 13.6484C14.7991 13.6871 14.6911 13.7216 14.5818 13.752C14.4186 13.7972 14.2523 13.8335 14.0847 13.8594C13.9631 13.8782 13.8399 13.8916 13.7156 13.9004C13.5851 13.9096 13.4533 13.9132 13.3201 13.9111C13.2472 13.91 13.1739 13.907 13.1003 13.9023L12.8787 13.8838C12.7698 13.8719 12.6604 13.8565 12.5505 13.8369V13.8359C12.4551 13.819 12.3594 13.7993 12.2634 13.7764H12.2625L12.1111 13.7383C11.9647 13.6987 11.8187 13.6581 11.6736 13.6162L11.4568 13.5518C11.3489 13.5195 11.2415 13.4866 11.1345 13.4531C11.0468 13.4257 10.9589 13.3984 10.8718 13.3701H10.8708C10.7879 13.3432 10.7053 13.3157 10.6228 13.2881L10.4529 13.2305C10.3843 13.207 10.3153 13.1823 10.2468 13.1582H10.2458C10.1976 13.1412 10.1495 13.1238 10.1013 13.1064C10.0048 13.0717 9.90801 13.0368 9.81226 13.001C9.75629 12.9801 9.69978 12.9587 9.64429 12.9375H9.64526C9.57057 12.9089 9.49562 12.8806 9.42163 12.8516C9.34317 12.8207 9.26514 12.7893 9.18726 12.7578C9.13656 12.7373 9.08562 12.7162 9.03491 12.6953C8.97217 12.6695 8.90905 12.6436 8.84644 12.6172C8.79776 12.5966 8.74909 12.5753 8.70093 12.5547C8.65044 12.533 8.5999 12.5112 8.54956 12.4893H8.54858L8.4187 12.4316L8.3396 12.3965C9.07828 11.9634 9.76988 11.454 10.4011 10.874H10.4021C10.4308 10.8477 10.4586 10.8205 10.4871 10.7939H10.488L10.5652 10.7207L10.616 10.6729V10.6719L10.7175 10.5732L10.7849 10.5068L10.989 10.3047L11.2664 10.0312L11.5037 9.7959L11.7273 9.5752L11.9607 9.34473L12.1746 9.13281L12.4714 8.83984C12.5261 8.78624 12.5821 8.73312 12.6384 8.68164C12.7426 8.58645 12.8497 8.49443 12.9597 8.40625L13.2693 8.17285C13.4173 8.06788 13.5705 7.9694 13.7273 7.87695C13.8809 7.7864 14.0387 7.70187 14.2 7.62402C14.2757 7.58742 14.3521 7.55222 14.4294 7.51855L14.6638 7.42188C14.7516 7.38759 14.8408 7.35463 14.9304 7.32422C14.975 7.30908 15.0199 7.29456 15.0652 7.28027L15.2585 7.22266Z" fill="#4E02E4" stroke="#C994F7" strokeWidth="0.5"/>
                      </svg>
                    </div>
                    <span className='text-xs text-foreground'>飞书消息</span>
                  </div>
                </div>

                {/* 提示信息 */}
                <div className='flex items-center gap-2 mb-8'>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="6" fill="#4E02E4"/>
                  </svg>
                  <span className='text-sm text-primary font-medium'>请注意查看通知</span>
                </div>

                {/* 按钮 */}
                {interviewNodeStatus === JobApplyNodeStatus.CompletedPendingReview && (
                  <div className='flex gap-4'>
                    <Button 
                      onClick={() => navigate({ to: '/home' })}
                      className='bg-primary hover:bg-primary/90 text-white px-8'
                    >
                      退出
                    </Button>
                    <Button 
                      variant='outline' 
                      onClick={() => setReinterviewOpen(true)}
                      className='border-border hover:bg-accent px-6'
                    >
                      重新面试
                    </Button>
                  </div>
                )}
              </div>

              {/* 右侧插画 */}
              <div className='hidden lg:block'>
                <div className='w-[300px] h-[240px] flex items-center justify-center'>
                  <img 
                    src="https://dnu-cdn.xpertiise.com/common/2292a9bb-d403-49e9-a600-97d5a0129557.png" 
                    alt="审核中" 
                    className='w-full h-full object-contain'
                  />
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ViewMode.EducationEval
            学历验证阶段：
            - 占位区，后续将接入学历验证流程（材料上传、验证结果等）
        */}
        {viewMode === ViewMode.EducationEval && (
          <div className='flex-1 grid grid-cols-1 gap-8 lg:grid-cols-12'>
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
          <div className='flex flex-1 flex-col items-center justify-center min-h-[60vh] space-y-6'>
            <img 
              className='w-auto max-w-[300px] h-auto object-contain' 
              src='https://dnu-cdn.xpertiise.com/common/2292a9bb-d403-49e9-a600-97d5a0129557.png' 
              alt='恭喜通过'
            />
            <div className='text-center whitespace-pre-line text-xl font-semibold leading-relaxed text-foreground'>
              {`恭喜你,你已通过本次筛选\n请注意查收通知中心的通知`}
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
          <div className='flex-1 w-full'>
            <QuestionnaireCollection nodeData={currentNodeData ?? undefined} />
          </div>
        )}
    </>
  )

  return (
    <>
      <Main fixed>
        {!isMobile ? (
          /* PC端：左右分栏布局 */
          <div className='flex gap-12 h-full pt-8 px-4'>
            {/* 左侧边栏 */}
            <div className='w-[245px] shrink-0 pr-6 border-r border-border'>
              <SidebarProgress
                jobApplyId={jobApplyId ?? null}
                onBackClick={handleBackClick}
                isMock={isMock}
              />
            </div>

            {/* 右侧内容区 */}
            <div className='flex-1 min-w-0 flex flex-col h-full'>
              {/* 顶部工具栏：寻求支持 */}
              <div className='flex justify-end mb-7 shrink-0'>
                <button
                  onClick={() => setSupportOpen(true)}
                  className='px-2 py-2 border border-border rounded-lg text-primary text-sm font-medium hover:bg-accent transition-colors'
                >
                  寻求支持
                </button>
              </div>

              {/* 内容区 */}
              <div className='flex-1 min-h-0 overflow-auto'>
                {renderContent()}
              </div>
            </div>
          </div>
        ) : (
          /* 移动端：保持原有布局 */
          <>
            <InterviewPrepareNav
              onBackClick={handleBackClick}
              onSupportClick={() => setSupportOpen(true)}
            />
            {isMobile && (
              <Steps jobApplyId={jobApplyId ?? null} isMock={isMock} />
            )}

            {/* 内容区 */}
            {renderContent()}
          </>
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
                            <span className='text-[14px]'>{salaryTypeMapping[job.salary_type as keyof typeof salaryTypeMapping] || '时'}薪制</span>
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
                          {job.salary_max && job.salary_max > 0 
                            ? `¥${job.salary_min ?? 0}~¥${job.salary_max}` 
                            : `¥${job.salary_min ?? 0}`}
                        </div>
                        <div className='text-xs text-muted-foreground mb-3'>每{salaryTypeUnitMapping[job.salary_type as keyof typeof salaryTypeUnitMapping] || '小时'}</div>
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
          src={'https://dnu-cdn.xpertiise.com/common/674ad0d6-cee5-4349-b98a-782f8f63470f.jpeg'}
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