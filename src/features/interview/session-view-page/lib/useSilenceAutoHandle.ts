import { useCallback, useEffect, useRef, useState } from 'react'
import { useRoomStore } from '@/stores/interview/room'
import RtcClient from '@/features/interview/session-view-page/lib/RtcClient'
import { string2tlv, COMMAND, INTERRUPT_PRIORITY } from './handler'

/**
 * 候选人静默处理：
 * - 当 isListening === true 且候选人侧没有新的文本消息时进行计时
 * - 第一次达到 10 秒：发送 TTS 提示
 * - 再次达到 10 秒（第二次静默）：触发结束面试回调
 */
export default function useSilenceAutoHandle(params: {
  onEndInterview: () => void
  botName?: string
  warningText?: string
  listenWindowMs?: number
}) {
  const { onEndInterview, botName = 'RobotMan_', warningText = '好像没有听到您的声音，您还在吗？', listenWindowMs = 20_000 } = params

  const isAITalking = useRoomStore((s) => s.isAITalking)
  const isAIThinking = useRoomStore((s) => s.isAIThinking)
  const messages = useRoomStore((s) => s.msgHistory)
  const scene = useRoomStore((s) => s.scene)
  const sceneConfigMap = useRoomStore((s) => s.sceneConfigMap)

  // listening = 既不在说话也不在思考
  const isListening = !isAITalking && !isAIThinking

  // 上次用户消息时间戳（排除 ChatBot）；为 0 表示尚未记录
  const lastUserMsgAtRef = useRef<number>(0)
  const warningPlayedRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const [silenceMs, setSilenceMs] = useState(0)

  // 过滤用户侧消息：!ChatBot 且非空字符串
  const computeHasNewUserMsg = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => typeof m.value === 'string' && m.value.length > 0)
    return lastUserMsg?.time ? new Date(lastUserMsg.time).getTime() : null
  }, [messages])

  // 尝试发送 TTS 提示
  const playWarning = useCallback((message: string = warningText) => {
    try {
      if (!RtcClient.engine) return
      const qs = new URLSearchParams(window.location.search)
      const targetBotName = `ChatBot_${qs.get('interview_id')}`
      RtcClient.engine.sendUserBinaryMessage(
        targetBotName,
        string2tlv(
          JSON.stringify({
            Command: COMMAND.EXTERNAL_TEXT_TO_SPEECH,
            Message: message,
            InterruptMode: INTERRUPT_PRIORITY.HIGH,
          }),
          'ctrl',
        ),
      )
    } catch {
      // 忽略播放失败
    }
  }, [botName, warningText, scene, sceneConfigMap])

  // 当用户侧有新消息时，更新时间戳（不会影响计时器的存活）
  useEffect(() => {
    const t = computeHasNewUserMsg()
    if (t != null && t > lastUserMsgAtRef.current) {
      lastUserMsgAtRef.current = t
    }
  }, [computeHasNewUserMsg])

  // 主循环：监听 listening 状态开启/关闭计时器
  useEffect(() => {
    if (!isListening) {
      // 离开 listening 状态，清理计时器
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      // 离开时重置第一次提示标记，避免下次进入仍保持已提示状态
      // warningPlayedRef.current = false
      setSilenceMs(0)
      return
    }

    // 进入 listening 状态时启动心跳
    if (!timerRef.current) {
      // 初始无用户消息记录，则以进入 listening 时刻为起点
      if (lastUserMsgAtRef.current === 0) lastUserMsgAtRef.current = Date.now()
      timerRef.current = window.setInterval(() => {
        const now = Date.now()
        const elapsed = now - lastUserMsgAtRef.current
        setSilenceMs(elapsed > 0 ? elapsed : 0)
        // 第一次达到阈值：播放提示
        if (elapsed >= listenWindowMs && !warningPlayedRef.current) {
          warningPlayedRef.current = true
          playWarning()
          // 重置计时点，从当前开始再计第二段 10s
          lastUserMsgAtRef.current = Date.now()
          setSilenceMs(0)
          return
        }

        // 第二次达到阈值：结束面试
        if (elapsed >= listenWindowMs && warningPlayedRef.current) {
          playWarning("听不到您的声音，面试即将结束，期待下次与您相见~")
          // 只触发一次
          // warningPlayedRef.current = false
          if (timerRef.current) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
          }
          setTimeout(() => {
            // 5s后结束面试
            onEndInterview()
          }, 5000)
        }
      }, 500)
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isListening, listenWindowMs, playWarning, onEndInterview])

  return { silenceMs, isListening }
}


