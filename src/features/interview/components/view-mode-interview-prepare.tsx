import { Button } from '@/components/ui/button'
import { LocalCameraPreview } from '@/features/interview/components/local-camera-preview'
import { ConnectionQualityBarsStandalone } from '@/components/interview/connection-quality-bars'
import { MobileDeviceStatusList } from '@/features/interview/components/mobile-device-status-list'
import { DeviceTestStatus } from '@/types/device'
import { useIsMobile } from '@/hooks/use-mobile'
import type { ApiJob } from '@/features/jobs/api'

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
  return (
    <div className='flex-1 flex flex-col lg:grid lg:gap-8 lg:grid-cols-12 max-w-screen-xl mx-auto'>
      {/* 左：职位标题 + 设备检查 */}
      <div className='lg:col-span-7 space-y-6 px-3 lg:pl-3 flex flex-col justify-center'>
        <div className='flex items-center justify-between'>
          <div className='text-2xl font-bold mb-2 leading-tight truncate'>
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
      <div className='hidden lg:flex lg:col-span-5 p-6 lg:sticky flex-col justify-center'>
        <div className='lg:my-36'>
          <Button
            disabled={
              cameraStatus !== DeviceTestStatus.Success ||
              micStatus !== DeviceTestStatus.Success ||
              spkStatus !== DeviceTestStatus.Success ||
              !interviewNodeId ||
              connecting
            }
            className='w-full mt-4 disabled:opacity-100 disabled:bg-[#C9C9C9] disabled:border-[0.5px] disabled:border-[rgba(255,255,255,0.12)]'
            onClick={onStartNewInterviewClick}
          >
            {connecting ? '面试间连接中…' : '确认设备，下一步'}
          </Button>
          <p className='text-xs text-muted-foreground mt-4'>
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
  return (
    <div className='flex flex-col w-full h-screen max-h-screen overflow-hidden'>
     

      {/* 可滚动内容区域 */}
      <div className='flex-1 min-h-0 overflow-auto'>
        <div className='py-4 px-2 mt-2 space-y-6'>
          {/* 职位标题 + 连接质量 */}
          <div className='flex items-center justify-between'>
            <div className='text-xl font-bold leading-tight truncate flex-1'>
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
          />

          {/* 设备状态列表 */}
          <MobileDeviceStatusList
            cameraStatus={cameraStatus}
            micStatus={micStatus}
            spkStatus={spkStatus}
          />
        </div>
      </div>
       {/* 顶部按钮区域 */}
       <div className='flex-shrink-0 py-4'>
        <Button
          disabled={
            cameraStatus !== DeviceTestStatus.Success ||
            micStatus !== DeviceTestStatus.Success ||
            spkStatus !== DeviceTestStatus.Success ||
            !interviewNodeId ||
            connecting
          }
          className='w-full'
          onClick={onStartNewInterviewClick}
        >
          {connecting ? '面试间连接中…' : '确认设备，下一步'}
        </Button>
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

