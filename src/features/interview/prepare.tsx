import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { UploadArea } from '@/features/resume-upload/upload-area'
import { useNavigate } from '@tanstack/react-router'
import { applyJob, generateInviteToken, InviteTokenType, useJobDetailQuery } from '@/features/jobs/api'
import { IconArrowLeft, IconBriefcase, IconWorldPin, IconVideo, IconVolume, IconMicrophone, IconCircleCheckFilled } from '@tabler/icons-react'
import { IconLoader2 } from '@tabler/icons-react'
import { useEffect, useState, useCallback } from 'react'
import { SupportDialog } from '@/features/interview/components/support-dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { LocalCameraPreview } from '@/features/interview/components/local-camera-preview'
import { SelectDropdown } from '@/components/select-dropdown'
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
import { confirmResume } from '@/features/interview/api'

interface InterviewPreparePageProps {
  jobId?: string | number
  inviteToken?: string
  isSkipConfirm?: boolean
}

enum ViewMode {
  Job = 'job',
  InterviewPrepare = 'interview-prepare'
}

const Steps = ({ currentStep }: { currentStep: number }) => {

  return (
    <div className='mt-8'>
      <div className='flex items-center gap-6'>
        <div className={cn('flex-1')}>
          <div className={cn('h-2 w-full rounded-full', currentStep === 0 ? 'bg-blue-600/10' : 'bg-primary')} />
          <div className='text-sm font-medium mb-2 text-center py-2'>简历分析</div>
        </div>
        <div className='flex-1'>
          <div className={cn('h-2 w-full rounded-full', currentStep === 0 ? 'bg-muted' : 'bg-blue-600/10')} />
          <div className='text-sm font-medium mb-2 text-muted-foreground text-center py-2'>AI 面试</div>
        </div>
      </div>
    </div>
  )
}

export default function InterviewPreparePage({ jobId, inviteToken, isSkipConfirm = false }: InterviewPreparePageProps) {
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadedThisVisit, setUploadedThisVisit] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeValues, setResumeValues] = useState<ResumeFormValues | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Job)
  const [cameraStatus, setCameraStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [micStatus, setMicStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [spkStatus, setSpkStatus] = useState<DeviceTestStatus>(DeviceTestStatus.Idle)
  const [stage, setStage] = useState<'headphone' | 'mic' | 'camera'>('camera')
  const cam = useMediaDeviceSelect({ kind: 'videoinput', requestPermissions: viewMode === ViewMode.InterviewPrepare })
  const user = useAuthStore((s) => s.auth.user)
  const [jobApplyId, setJobApplyId] = useState<number | string | null>(null)

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

  const handleApplyJob = useCallback(async function handleApplyJob() {
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
  useEffect(() => {
    if (viewMode !== ViewMode.InterviewPrepare) return
    if (!cam.activeDeviceId && cam.devices && cam.devices.length > 0) {
      cam.setActiveMediaDevice(cam.devices[0].deviceId)
      setCameraStatus(DeviceTestStatus.Testing)
    }
  }, [cam, viewMode])

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

  return (
    <>
      <Main fixed>
        {/* 顶部工具栏：返回 + 寻求支持 */}
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => window.history.back()}
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

        {/* 主要布局组件 —— 职位与简历上传 */}
        {viewMode === ViewMode.Job && (
          <div className='flex-1 grid grid-cols-1 gap-8 lg:grid-cols-12'>
            {/* 左：职位信息 */}
            <div className='lg:col-span-7 space-y-6 pl-3'>
              <div className='p-6 h-full flex-col'>
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
                      {job ? `¥${job.salaryRange?.[0] ?? 0}~¥${job.salaryRange?.[1] ?? 0}` : '—'}
                    </div>
                    <div className='text-xs text-muted-foreground mb-3'>每小时</div>
                  </div>
                </div>
                <Separator className='mt-2' />
                {/* 发布者信息 */}
                <div className='flex items-center gap-3 py-4 border-b border-border'>
                  <div className='w-9 h-9 border-2 border-gray-200 rounded-full flex items-center justify-center overflow-hidden bg-white'>
                    <img src={'https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding.svg'} alt='meetchances' className='h-7 w-7 object-contain' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>由一面千识发布</span>
                    <span className='text-xs mt-[10px] text-muted-foreground'>meetchances.com</span>
                  </div>
                </div>
                <div className='flex-1 text-foreground/90 leading-relaxed text-sm md:text-base py-4'>
                  {/* 限高 + 渐隐遮罩 */}
                  <div className='relative'>
                    <div className='overflow-hidden'>
                      {job?.description ? (
                        <div dangerouslySetInnerHTML={{ __html: job.description }} />
                      ) : (
                        <div className='text-muted-foreground'>{isLoading ? '正在加载职位详情…' : '暂无职位描述'}</div>
                      )}
                    </div>
                    {/* 渐隐遮罩 */}
                    <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent' />
                  </div>
                  <div className='mt-4'>
                    <Button variant='outline' onClick={() => setDrawerOpen(true)}>查看更多</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右：上传简历 */}
            <div className='lg:col-span-5'>
              <div className='p-6 sticky relative'>
                <UploadArea
                  className='my-4'
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
                />

                {/* 解析后的基础信息 */}
                {resumeValues && (
                  <div className='mt-4 flex items-center justify-between rounded-md border p-3'>
                    <div className='text-sm'>
                      <div className='font-medium'>姓名：{resumeValues.name || '—'}</div>
                      <div className='text-muted-foreground mt-1'>电话：{resumeValues.phone || '—'}</div>
                    </div>
                    <Button size='sm' variant='outline' onClick={() => setResumeOpen(true)}>点击查看</Button>
                  </div>
                )}

                <div className='my-4'>
                  <Button className='w-full' disabled={uploadingResume || !resumeValues} onClick={async () => {
                    if (uploadedThisVisit) {
                      setConfirmOpen(true)
                    } else {
                      if (viewMode === ViewMode.Job) {
                        if (jobApplyId != null) {
                          try {
                            await confirmResume(jobApplyId)
                          } catch (_e) {
                            // ignore, allow navigation even if confirm fails
                          }
                        }
                        setViewMode(ViewMode.InterviewPrepare)
                      } else {
                        navigate({ to: '/interview/session', search: { job_id: (jobId as string | number) || '' } })
                      }
                    }
                  }}>
                    {uploadingResume ? '正在分析简历…' : '确认简历，下一步'}
                  </Button>
                </div>

                {/* 区域遮罩：结果未返回（上传/分析中）时禁用交互 */}
                {uploadingResume && (
                  <div className='pointer-events-auto absolute inset-0 z-10 grid place-items-center rounded-md bg-background/60 backdrop-blur-[1px]'>
                    <div className='rounded-lg border bg-background p-3 shadow flex items-center gap-2 text-sm text-muted-foreground'>
                      <IconLoader2 className='h-4 w-4 animate-spin text-primary' /> 正在上传并分析简历…
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>)}

        {/* 主要布局组件 —— 面试准备 */}
        {viewMode === ViewMode.InterviewPrepare && (
          <div className='flex-1 grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-screen-xl mx-auto'>
            {/* 左：职位标题 + 设备检查 */}
            <div className='lg:col-span-7 space-y-6 pl-3'>
              <div className='text-2xl font-bold mb-2 leading-tight truncate'>{job?.title ?? (isLoading ? '加载中…' : '未找到职位')}</div>
              <div className='flex items-center gap-4 text-gray-500 mb-2'>
                <p>职位描述，这里的字段需要再明确</p>
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
              />

              {/* 三个设备选择 + 状态 */}
              <DeviceSelectorsRow
                camActiveDeviceId={cam.activeDeviceId}
                camDevices={cam.devices}
                onCamChange={(v) => {
                  cam.setActiveMediaDevice(v)
                  setCameraStatus(DeviceTestStatus.Testing)
                }}
                cameraStatus={cameraStatus}
                micStatus={micStatus}
                spkStatus={spkStatus}
                onMicStatusChange={setMicStatus}
                onSpkStatusChange={setSpkStatus}
              />
            </div>

            {/* 右：操作区域 */}
            <div className='lg:col-span-5 p-6 sticky flex flex-col justify-start'>
              <div className='my-36'>
                <Button 
                  disabled={
                    cameraStatus !== DeviceTestStatus.Success 
                    || micStatus !== DeviceTestStatus.Success 
                    || spkStatus !== DeviceTestStatus.Success
                  } 
                  className='w-full' onClick={async () => {
                    navigate({ to: '/interview/session', search: { job_id: (jobId as string | number) || '' } })
                  }}>
                  确认设备，下一步
                </Button>
                <p className='text-xs text-muted-foreground mt-4'>请在安静、独立的空间进行本次AI面试，确保评估效果最佳</p>
              </div>
            </div>
          </div>
          
        )}

        {/* 底部步骤与下一步 */}
        <Steps currentStep={viewMode === ViewMode.InterviewPrepare ? 1 : 0} />

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
            <Button onClick={() => {
              setConfirmOpen(false)
              if (viewMode === ViewMode.Job) {
                setViewMode(ViewMode.InterviewPrepare)
              } else {
                navigate({ to: '/interview/session', search: { job_id: (jobId as string | number) || '' } })
              }
            }}>继续</Button>
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
              <div className='flex-1 overflow-y-auto'>
                {/* 标题与薪资区 */}
                <div className='flex pt-5 pb-5 items-start justify-between border-b border-border'>
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
                      ¥{job.salaryRange?.[0] ?? 0}~¥{job.salaryRange?.[1] ?? 0}
                    </div>
                    <div className='text-xs text-muted-foreground mb-3'>每小时</div>
                  </div>
                </div>

                {/* 发布者信息 */}
                <div className='flex items-center gap-3 py-4 border-b border-border'>
                  <div className='w-9 h-9 border-2 border-gray-200 rounded-full flex items-center justify-center overflow-hidden bg-white'>
                    <img src={'https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding.svg'} alt='meetchances' className='h-7 w-7 object-contain' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>由一面千识发布</span>
                    <span className='text-xs mt-[10px] text-muted-foreground'>meetchances.com</span>
                  </div>
                </div>

                {/* 详情描述 */}
                <div className='py-6 text-foreground/90 text-base leading-relaxed'>
                  <div dangerouslySetInnerHTML={{ __html: job.description }} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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

