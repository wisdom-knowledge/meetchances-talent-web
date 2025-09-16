import { useCallback, useEffect, useRef, useState } from 'react'

interface UseCameraStatusDetectionOptions {
  /** 检测间隔，毫秒，默认 1000ms */
  checkInterval?: number
  /** 是否启用检测，默认 true */
  enabled?: boolean
  /** 是否使用 Canvas 检测，默认 false */
  useCanvasDetection?: boolean
  /** Canvas 检测的亮度阈值，默认 10 */
  brightnessThreshold?: number
}

interface CameraStatus {
  /** 是否为黑屏或异常 */
  hasIssue: boolean
  /** 具体的问题类型 */
  issueType: 'black-screen' | 'no-video-track' | 'track-ended' | 'no-dimensions' | 'not-playing' | null
  /** 问题描述 */
  issueDescription: string | null
}

interface UseCameraStatusDetectionReturn extends CameraStatus {
  /** 开始检测 */
  startDetection: () => void
  /** 停止检测 */
  stopDetection: () => void
  /** 手动检测一次 */
  checkOnce: () => void
}

/**
 * 摄像头状态检测 Hook
 * 结合多种方法检测摄像头是否正常工作
 */
export function useCameraStatusDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  streamRef: React.RefObject<MediaStream | null>,
  options: UseCameraStatusDetectionOptions = {}
): UseCameraStatusDetectionReturn {
  const {
    checkInterval = 1000,
    enabled = true,
    useCanvasDetection = false,
    brightnessThreshold = 10
  } = options

  const [status, setStatus] = useState<CameraStatus>({
    hasIssue: true, // 启用Canvas检测时，默认有问题，检测确认后再允许
    issueType: null,
    issueDescription: null
  })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<number | null>(null)

  const checkBlackScreen = useCallback((video: HTMLVideoElement): boolean => {
    try {
      // 创建 canvas 用于分析视频帧
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return true

      // 使用更小的采样区域提高性能
      const sampleWidth = Math.min(video.videoWidth, 32)
      const sampleHeight = Math.min(video.videoHeight, 32)
      canvas.width = sampleWidth
      canvas.height = sampleHeight

      // 将视频帧绘制到 canvas 上
      ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight)

      // 获取像素数据 - 只检查部分像素提高性能
      const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
      const pixels = imageData.data

      // 采样检测：每隔4个像素检查一次，进一步提高性能
      let totalBrightness = 0
      let pixelCount = 0
      let nonZeroPixels = 0

      for (let i = 0; i < pixels.length; i += 16) { // 每隔4个像素采样
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]

        // 检查是否有非零像素（有内容）
        if (r > 0 || g > 0 || b > 0) {
          nonZeroPixels++
        }

        const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
        totalBrightness += brightness
        pixelCount++
      }

      // 如果所有像素都是0，肯定是黑屏
      if (nonZeroPixels === 0) {
        return true
      }

      // 如果非零像素太少，也认为是黑屏
      const nonZeroRatio = nonZeroPixels / pixelCount
      if (nonZeroRatio < 0.1) { // 少于10%的像素有内容
        return true
      }

      const averageBrightness = totalBrightness / pixelCount
      return averageBrightness < brightnessThreshold
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to analyze video frame:', error)
      return true
    }
  }, [brightnessThreshold])

  const checkCameraStatus = useCallback(() => {
    const video = videoRef.current
    const stream = streamRef.current

    // 基础检查：video 元素是否存在
    if (!video) {
      setStatus({
        hasIssue: true,
        issueType: 'no-video-track',
        issueDescription: '视频元素不存在'
      })
      return
    }

    // 检查 1: 视频流是否存在
    if (!stream) {
      setStatus({
        hasIssue: true,
        issueType: 'no-video-track',
        issueDescription: '没有视频流'
      })
      return
    }

    // 检查 2: 视频轨道状态
    const videoTracks = stream.getVideoTracks()
    if (videoTracks.length === 0) {
      setStatus({
        hasIssue: true,
        issueType: 'no-video-track',
        issueDescription: '没有视频轨道'
      })
      return
    }

    const videoTrack = videoTracks[0]
    if (videoTrack.readyState === 'ended' || !videoTrack.enabled) {
      setStatus({
        hasIssue: true,
        issueType: 'track-ended',
        issueDescription: '视频轨道已结束或被禁用'
      })
      return
    }

    // 检查 3: 视频尺寸
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setStatus({
        hasIssue: true,
        issueType: 'no-dimensions',
        issueDescription: '视频没有尺寸信息'
      })
      return
    }

    // 检查 4: 视频是否在播放 (只检查 ended 状态，paused 可能是正常的)
    if (video.ended) {
      setStatus({
        hasIssue: true,
        issueType: 'not-playing',
        issueDescription: '视频已结束'
      })
      return
    }

    // 检查 5: Canvas 黑屏检测（可选）
    if (useCanvasDetection) {
      const isBlackScreen = checkBlackScreen(video)
      if (isBlackScreen) {
        setStatus({
          hasIssue: true,
          issueType: 'black-screen',
          issueDescription: '检测到黑屏'
        })
        return
      }
    }

    // 所有检查都通过
    setStatus({
      hasIssue: false,
      issueType: null,
      issueDescription: null
    })
  }, [videoRef, streamRef, useCanvasDetection, checkBlackScreen])

  const startDetection = useCallback(() => {
    if (!enabled) return

    // 清除之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // 立即检测一次
    checkCameraStatus()

    // 开始定期检测
    intervalRef.current = window.setInterval(checkCameraStatus, checkInterval)
  }, [enabled, checkCameraStatus, checkInterval])

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // 停止检测时保持当前状态，不重置
  }, [])

  const checkOnce = useCallback(() => {
    if (enabled) {
      checkCameraStatus()
    }
  }, [enabled, checkCameraStatus])

  // 清理资源
  useEffect(() => {
    return () => {
      stopDetection()
      if (canvasRef.current) {
        canvasRef.current = null
      }
    }
  }, [stopDetection])

  return {
    hasIssue: status.hasIssue,
    issueType: status.issueType,
    issueDescription: status.issueDescription,
    startDetection,
    stopDetection,
    checkOnce
  }
}
