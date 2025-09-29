import { useEffect, useRef } from 'react'
import { reportFirstTokenDuration, reportThinkingDuration, userEvent } from '@/lib/apm'
import { useRoomStore } from '@/stores/interview/room'

/**
 * 监听 AI Agent 的思考/说话状态变更并上报相关指标
 * - 首次 speaking：first_token_time（从 hook 挂载时刻计算）
 * - thinking start/end：上报单轮 thinking_duration（按回合）
 * - 轮次里程碑：第 2/5 轮到达时上报一次事件
 */
export function useAgentApm(): void {
  const isAITalking = useRoomStore((s) => s.isAITalking)
  const isAIThinking = useRoomStore((s) => s.isAIThinking)
  const isSpeaking = Boolean(isAITalking)
  const isThinking = Boolean(isAIThinking)

  // 回合号（从 0 开始），进入 speaking 时 +1
  const currentRoundRef = useRef<number>(0)
  // thinking 起点时间
  const thinkingStartRef = useRef<number | null>(null)
  // 首次 speaking 上报控制
  const mountTimeRef = useRef<number>(performance.now())
  const firstTokenReportedRef = useRef<boolean>(false)
  // 轮次里程碑去重
  const reportedRound2ReachedRef = useRef<boolean>(false)
  const reportedRound5ReachedRef = useRef<boolean>(false)

  useEffect(() => {
    // thinking start（不改变回合号）
    if (isThinking && thinkingStartRef.current == null) {
      thinkingStartRef.current = performance.now()

      // 轮次里程碑：在 thinking 开始时按当前回合触发
      if (!reportedRound2ReachedRef.current && currentRoundRef.current === 2) {
        reportedRound2ReachedRef.current = true
        const qs = new URLSearchParams(window.location.search)
        userEvent('interview_rounds_2_reached', '面试问答超过2轮', {
          job_id: qs.get('job_id') ?? undefined,
          is_mock: qs.get('is_mock') ?? undefined,
          interview_id: qs.get('interview_id') ?? undefined,
          job_apply_id: qs.get('job_apply_id') ?? undefined,
        })
      }
      if (!reportedRound5ReachedRef.current && currentRoundRef.current === 5) {
        reportedRound5ReachedRef.current = true
        const qs = new URLSearchParams(window.location.search)
        userEvent('interview_rounds_5_reached', '面试问答5轮', {
          job_id: qs.get('job_id') ?? undefined,
          is_mock: qs.get('is_mock') ?? undefined,
          interview_id: qs.get('interview_id') ?? undefined,
          job_apply_id: qs.get('job_apply_id') ?? undefined,
        })
      }
    }

    // thinking end（不改变回合号）
    if (!isThinking && thinkingStartRef.current != null) {
      const duration = performance.now() - thinkingStartRef.current
      reportThinkingDuration(currentRoundRef.current, duration)
      thinkingStartRef.current = null
    }

    // agent start talk：进入 speaking 时，当前回合 +1
    if (isSpeaking) {
      currentRoundRef.current = currentRoundRef.current + 1
      if (!firstTokenReportedRef.current) {
        firstTokenReportedRef.current = true
        const duration = performance.now() - mountTimeRef.current
        reportFirstTokenDuration(duration)
      }
    }
  }, [isThinking, isSpeaking])
}

export default useAgentApm
