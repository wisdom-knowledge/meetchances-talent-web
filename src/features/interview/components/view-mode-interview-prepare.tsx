import { useState } from 'react'
import { DeviceTestStatus } from '@/types/device'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { ConnectionQualityBarsStandalone } from '@/components/interview/connection-quality-bars'
import { LocalCameraPreview } from '@/features/interview/components/local-camera-preview'
import { MobileDeviceStatusList } from '@/features/interview/components/mobile-device-status-list'
import type { ApiJob } from '@/features/jobs/api'

// 准备步骤枚举
type PreparationStep = 'camera' | 'audio' | 'audioQuality' | 'final'

interface DeviceSelectorsRowProps {
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
}

interface ViewModeInterviewPrepareProps {
  job?: ApiJob
  isLoading: boolean
  isMock: boolean
  jobApplyId: string | number | null
  interviewNodeId?: number | string | null
  connecting: boolean
  stage: 'camera' | 'headphone' | 'mic'
  cameraStatus: DeviceTestStatus
  micStatus: DeviceTestStatus
  spkStatus: DeviceTestStatus
  camActiveDeviceId?: string
  camDevices: Array<{ deviceId: string; label: string }>
  currentSpkDeviceId?: string
  currentMicDeviceId?: string
  onStartNewInterviewClick: () => void
  onSpkStatusChange: (status: DeviceTestStatus) => void
  onMicStatusChange: (status: DeviceTestStatus) => void
  onCameraStatusChange: (status: DeviceTestStatus) => void
  onStageChange: (stage: 'camera' | 'headphone' | 'mic') => void
  onCamChange: (id: string) => void
  onSpkDeviceChange: (deviceId: string) => void
  onMicDeviceChange: (deviceId: string) => void
  onCameraDeviceResolved: (resolvedId: string | null) => void
  onCameraConfirmed: () => void
  onHeadphoneConfirm: () => void
  onMicConfirmed: () => void
  DeviceSelectorsRow: React.ComponentType<DeviceSelectorsRowProps>
}

// 通用的“双按钮”区域：左侧按钮随步骤变化，右侧按钮统一使用 buttonConfig
function TwoActionButtons({
  leftLabel,
  leftOnClick,
  leftDisabled,
  rightClassName,
  rightDisabled,
  rightOnClick,
  rightText,
}: {
  leftLabel: string
  leftOnClick: () => void
  leftDisabled: boolean
  rightClassName: string
  rightDisabled: boolean
  rightOnClick: () => void
  rightText: string
}) {
  return (
    <div className='flex gap-2.5'>
      <Button variant='outline' onClick={leftOnClick} disabled={leftDisabled}>
        {leftLabel}
      </Button>
      <Button className={rightClassName} disabled={rightDisabled} onClick={rightOnClick}>
        {rightText}
      </Button>
    </div>
  )
}

// 通用 handler 构造器（PC/移动端复用）
function _createPrepareFlowActions(args: {
  onCameraConfirmed: () => void
  onHeadphoneConfirm: () => void
  onMicConfirmed: () => void
  setPreparationStep: (s: PreparationStep) => void
  setPlaySignal: (updater: (v: number) => number) => void
  setAudioConfirmed: (b: boolean) => void
  setMicRecorded: (b: boolean) => void
  onStartNewInterviewClick: () => void
}) {
  const {
    onCameraConfirmed,
    onHeadphoneConfirm,
    onMicConfirmed,
    setPreparationStep,
    setPlaySignal,
    setAudioConfirmed,
    setMicRecorded,
    onStartNewInterviewClick,
  } = args

  const handleCameraConfirm = () => {
    onCameraConfirmed()
    setPreparationStep('audio')
    // 进入音频环节自动播放一次测试音频
    setPlaySignal((v: number) => v + 1)
  }

  const handleAudioConfirm = () => {
    onHeadphoneConfirm()
    setAudioConfirmed(true)
    setPreparationStep('audioQuality')
  }

  const handleMicConfirm = () => {
    onMicConfirmed()
    setMicRecorded(false)
    setPreparationStep('final')
  }

  const handleFinalConfirm = () => {
    onStartNewInterviewClick()
  }

  const handleReplayAudio = () => {
    setAudioConfirmed(false)
    setPlaySignal((v: number) => v + 1)
  }

  return { handleCameraConfirm, handleAudioConfirm, handleMicConfirm, handleFinalConfirm, handleReplayAudio }
}

// 统一构建右侧主按钮配置（桌面端/移动端共用）
type ButtonCfg = { text: string; disabled: boolean; onClick: () => void; className: string }
function buildButtonConfig(args: {
  preparationStep: PreparationStep
  cameraStatus: DeviceTestStatus
  micStatus: DeviceTestStatus
  spkStatus: DeviceTestStatus
  interviewNodeId?: number | string | null
  connecting: boolean
  hasIssue: boolean
  playSignal: number
  micRecorded: boolean
  onCameraClick: () => void
  onAudioClick: () => void
  onMicClick: () => void
  onFinalClick: () => void
}): ButtonCfg {
  const {
    preparationStep,
    cameraStatus,
    micStatus,
    spkStatus,
    interviewNodeId,
    connecting,
    hasIssue,
    playSignal,
    micRecorded,
    onCameraClick,
    onAudioClick,
    onMicClick,
    onFinalClick,
  } = args

  const GRADIENT = 'w-full bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)]'
  const DISABLED = 'w-full bg-[#C9C9C9] text-white'

  switch (preparationStep) {
    case 'camera':
      return {
        text: '确认摄像头正常，下一步',
        disabled: cameraStatus === DeviceTestStatus.Failed || hasIssue,
        onClick: onCameraClick,
        className: cameraStatus !== DeviceTestStatus.Failed && !hasIssue ? GRADIENT : DISABLED,
      }
    case 'audio':
      return {
        text: '确认声音正常，下一步',
        disabled: playSignal <= 0,
        onClick: onAudioClick,
        className: playSignal > 0 ? GRADIENT : DISABLED,
      }
    case 'audioQuality':
      return {
        text: '确认音质正常，下一步',
        disabled: !micRecorded,
        onClick: onMicClick,
        className: micRecorded ? GRADIENT : DISABLED,
      }
    case 'final':
      {
        const ok =
          !!interviewNodeId &&
          !connecting &&
          cameraStatus === DeviceTestStatus.Success &&
          micStatus === DeviceTestStatus.Success &&
          spkStatus === DeviceTestStatus.Success
        return {
          text: '已确认音画清晰，下一步',
          disabled: !ok,
          onClick: onFinalClick,
          className: ok ? GRADIENT : DISABLED,
        }
      }
    default:
      return { text: '确认设备，下一步', disabled: true, onClick: () => {}, className: DISABLED }
  }
}

// PC 端组件
function DesktopViewModeInterviewPrepare({
  job,
  isLoading,
  connecting,
  stage,
  cameraStatus,
  micStatus,
  spkStatus,
  camActiveDeviceId,
  camDevices,
  currentSpkDeviceId,
  currentMicDeviceId,
  interviewNodeId,
  onStartNewInterviewClick,
  onCameraStatusChange,
  onCamChange,
  onSpkDeviceChange,
  onMicDeviceChange,
  onCameraDeviceResolved,
  onCameraConfirmed,
  onHeadphoneConfirm,
  onMicConfirmed,
  DeviceSelectorsRow,
}: ViewModeInterviewPrepareProps) {
  // 准备步骤状态管理
  const [preparationStep, setPreparationStep] =
    useState<PreparationStep>('camera')
  const [audioConfirmed, setAudioConfirmed] = useState(false)
  const [hasIssue, setHasIssue] = useState(false)
  const [micRecorded, setMicRecorded] = useState(false)
  const [retakeSignal, setRetakeSignal] = useState(0)
  const [isTestAudioPlaying, setIsTestAudioPlaying] = useState(false)
  const [isMicRecording, setIsMicRecording] = useState(false)
  const [pendingConnect, setPendingConnect] = useState(false)
  const [playSignal, setPlaySignal] = useState(0)

  // 通用 handler
  const { handleCameraConfirm, handleAudioConfirm, handleMicConfirm, handleFinalConfirm, handleReplayAudio } = _createPrepareFlowActions({
    onCameraConfirmed,
    onHeadphoneConfirm,
    onMicConfirmed,
    setPreparationStep,
    setPlaySignal,
    setAudioConfirmed,
    setMicRecorded,
    onStartNewInterviewClick,
  })

  const buttonConfig = buildButtonConfig({
    preparationStep,
    cameraStatus,
    micStatus,
    spkStatus,
    interviewNodeId,
    connecting,
    hasIssue,
    playSignal,
    micRecorded,
    onCameraClick: handleCameraConfirm,
    onAudioClick: handleAudioConfirm,
    onMicClick: handleMicConfirm,
    onFinalClick: handleFinalConfirm,
  })

  // 桌面端使用通用组件
  const renderTwoActionButtonsDesktop = () => {
    const isAudioStep = preparationStep === 'audio'
    const handleRightClick = () => {
      if (preparationStep === 'final') setPendingConnect(true)
      try {
        buttonConfig.onClick()
      } catch {
        // ignore
      }
    }
    return (
      <TwoActionButtons
        leftLabel={isAudioStep ? '重新播放' : '重录'}
        leftOnClick={
          isAudioStep
            ? handleReplayAudio
            : () => {
                setMicRecorded(false)
                setRetakeSignal((v: number) => v + 1)
              }
        }
        leftDisabled={isAudioStep ? isTestAudioPlaying : isMicRecording}
        rightClassName={`flex-1 ${buttonConfig.className}`}
        rightDisabled={buttonConfig.disabled || pendingConnect}
        rightOnClick={handleRightClick}
        rightText={pendingConnect ? '面试间连接中...' : buttonConfig.text}
      />
    )
  }

  return (
    <div className='mx-auto flex max-w-screen-xl flex-1 flex-col lg:grid lg:grid-cols-12 lg:gap-8'>
      {/* 左：职位标题 + 设备检查 */}
      <div className='flex flex-col justify-center space-y-6 px-3 md:col-span-7 md:pl-3'>
        <div className='flex items-center justify-between'>
          <div className='mb-2 truncate text-2xl leading-tight font-bold'>
            {job?.title ?? (isLoading ? '加载中…' : '未找到职位')}
          </div>
          <div className='ml-4 flex-shrink-0'>
            <ConnectionQualityBarsStandalone />
          </div>
        </div>

        {/* 用户摄像头展示区域 */}
        <LocalCameraPreview
          stage={stage}
          onHeadphoneConfirm={onHeadphoneConfirm}
          onStatusChange={onCameraStatusChange}
          deviceId={camActiveDeviceId}
          speakerDeviceId={currentSpkDeviceId}
          micDeviceId={currentMicDeviceId}
          onCameraDeviceResolved={onCameraDeviceResolved}
          onCameraConfirmed={onCameraConfirmed}
          onMicConfirmed={onMicConfirmed}
          disableCameraConfirm={cameraStatus === DeviceTestStatus.Failed}
          preparationStep={preparationStep}
          audioConfirmed={audioConfirmed}
          onReplayAudio={handleReplayAudio}
          onHasIssueChange={setHasIssue}
          playTestAudioSignal={playSignal}
          retakeMicSignal={retakeSignal}
          onMicRecordComplete={() => setMicRecorded(true)}
          onTestAudioPlayingChange={setIsTestAudioPlaying}
          onMicRecordingChange={setIsMicRecording}
        />

        {/* 三个设备选择 + 状态 */}
        <DeviceSelectorsRow
          camActiveDeviceId={camActiveDeviceId}
          camDevices={camDevices}
          onCamChange={onCamChange}
          cameraStatus={cameraStatus}
          micStatus={micStatus}
          spkStatus={spkStatus}
          onMicStatusChange={() => {}}
          onSpkStatusChange={() => {}}
          onSpkDeviceChange={onSpkDeviceChange}
          onMicDeviceChange={onMicDeviceChange}
        />
      </div>

      {/* 右：操作区域（桌面端） */}
      <div className='hidden flex-col justify-center p-6 md:sticky md:col-span-5 md:flex'>
        <div className='lg:my-36'>
          {/* 音频步骤的按钮组 */}
          {preparationStep === 'audio' || preparationStep === 'audioQuality' ? (
            renderTwoActionButtonsDesktop()
          ) : (
            <Button
              className={buttonConfig.className}
              disabled={buttonConfig.disabled || pendingConnect}
              onClick={() => {
                if (preparationStep === 'final') setPendingConnect(true)
                buttonConfig.onClick()
              }}
            >
              {pendingConnect ? '面试间连接中...' : buttonConfig.text}
            </Button>
          )}
          <p className='text-muted-foreground mt-4 text-xs'>
            请在安静、独立的空间进行本次AI面试，确保评估效果最佳
          </p>
        </div>
      </div>
    </div>
  )
}

// 移动端组件
function MobileViewModeInterviewPrepare({
  job,
  isLoading,
  connecting,
  stage,
  cameraStatus,
  micStatus,
  spkStatus,
  camActiveDeviceId,
  currentSpkDeviceId,
  currentMicDeviceId,
  interviewNodeId,
  onStartNewInterviewClick,
  onCameraStatusChange,
  onCameraDeviceResolved,
  onCameraConfirmed,
  onHeadphoneConfirm,
  onMicConfirmed,
}: ViewModeInterviewPrepareProps) {
  // 准备步骤状态管理
  const [preparationStep, setPreparationStep] =
    useState<PreparationStep>('camera')
  const [audioConfirmed, setAudioConfirmed] = useState(false)
  const [hasIssue, setHasIssue] = useState(false)
  const [playSignal, setPlaySignal] = useState(0)
  const [micRecorded, setMicRecorded] = useState(false)
  const [retakeSignal, setRetakeSignal] = useState(0)
  const [isTestAudioPlaying, setIsTestAudioPlaying] = useState(false)
  const [isMicRecording, setIsMicRecording] = useState(false)
  const [pendingConnect, setPendingConnect] = useState(false)

  // 通用 handler
  const { handleCameraConfirm, handleAudioConfirm, handleFinalConfirm, handleReplayAudio } = _createPrepareFlowActions({
    onCameraConfirmed,
    onHeadphoneConfirm,
    onMicConfirmed,
    setPreparationStep,
    setPlaySignal,
    setAudioConfirmed,
    setMicRecorded,
    onStartNewInterviewClick,
  })

  const buttonConfig = buildButtonConfig({
    preparationStep,
    cameraStatus,
    micStatus,
    spkStatus,
    interviewNodeId,
    connecting,
    hasIssue,
    playSignal,
    micRecorded,
    onCameraClick: handleCameraConfirm,
    onAudioClick: handleAudioConfirm,
    onMicClick: () => { onMicConfirmed(); handleFinalConfirm() },
    onFinalClick: handleFinalConfirm,
  })
  return (
    <div className='flex h-screen max-h-screen w-full flex-col overflow-hidden'>
      {/* 可滚动内容区域 */}
      <div className='min-h-0 flex-1 overflow-auto'>
        <div className='mt-2 space-y-6 px-2 py-4'>
          {/* 职位标题 + 连接质量 */}
          <div className='flex items-center justify-between'>
            <div className='flex-1 truncate text-xl leading-tight font-bold'>
              {job?.title ?? (isLoading ? '加载中…' : '未找到职位')}
            </div>
            <div className='ml-4 flex-shrink-0'>
              <ConnectionQualityBarsStandalone />
            </div>
          </div>

          {/* 用户摄像头展示区域 */}
          <LocalCameraPreview
            stage={stage}
            onHeadphoneConfirm={onHeadphoneConfirm}
            onStatusChange={onCameraStatusChange}
            deviceId={camActiveDeviceId}
            speakerDeviceId={currentSpkDeviceId}
            micDeviceId={currentMicDeviceId}
            onCameraDeviceResolved={onCameraDeviceResolved}
            onCameraConfirmed={onCameraConfirmed}
            onMicConfirmed={onMicConfirmed}
            disableCameraConfirm={cameraStatus === DeviceTestStatus.Failed}
            preparationStep={preparationStep}
            audioConfirmed={audioConfirmed}
            onReplayAudio={handleReplayAudio}
            onHasIssueChange={setHasIssue}
            playTestAudioSignal={playSignal}
            retakeMicSignal={retakeSignal}
            onMicRecordComplete={() => setMicRecorded(true)}
            onTestAudioPlayingChange={setIsTestAudioPlaying}
            onMicRecordingChange={setIsMicRecording}
          />

          {/* 设备状态列表 */}
          <MobileDeviceStatusList
            cameraStatus={cameraStatus}
            micStatus={micStatus}
            spkStatus={spkStatus}
          />
        </div>
      </div>
      {/* 底部按钮区域 */}
      <div className='flex-shrink-0 py-4'>
        {/* 音频步骤的按钮组 */}
        {preparationStep === 'audio' || preparationStep === 'audioQuality' ? (
          <TwoActionButtons
            leftLabel={preparationStep === 'audio' ? '重新播放' : '重录'}
            leftOnClick={
              preparationStep === 'audio'
                ? handleReplayAudio
                : () => {
                    setMicRecorded(false)
                    setRetakeSignal((v: number) => v + 1)
                  }
            }
            leftDisabled={preparationStep === 'audio' ? isTestAudioPlaying : isMicRecording}
            rightClassName={`flex-1 ${buttonConfig.className}`}
            rightDisabled={buttonConfig.disabled || pendingConnect}
            rightOnClick={() => {
              // 移动端最后一步：确认麦克风即进入面试
              if (preparationStep === 'audioQuality') setPendingConnect(true)
              buttonConfig.onClick()
            }}
            rightText={pendingConnect ? '面试间连接中...' : buttonConfig.text}
          />
        ) : (
          <Button
            className={buttonConfig.className}
            disabled={buttonConfig.disabled || pendingConnect}
            onClick={() => {
              if (preparationStep === 'final') setPendingConnect(true)
              buttonConfig.onClick()
            }}
          >
            {pendingConnect ? '面试间连接中...' : buttonConfig.text}
          </Button>
        )}
      </div>
    </div>
  )
}

export function ViewModeInterviewPrepare(props: ViewModeInterviewPrepareProps) {
  const isMobile = useIsMobile()

  return isMobile ? (
    <MobileViewModeInterviewPrepare {...props} />
  ) : (
    <DesktopViewModeInterviewPrepare {...props} />
  )
}
