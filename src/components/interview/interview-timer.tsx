import { useEffect, useState, useMemo, useCallback } from 'react'
import { useJobDetailQuery } from '@/features/jobs/api'

export function InterviewTimer({ active, className }: { active?: boolean; className?: string }) {
  // 获取 jobId 并查询职位信息
  const jobId = useMemo(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const id = params.get('job_id')
    if (!id) return null
    const n = Number(id)
    return Number.isNaN(n) ? id : n
  }, [])

  const { data: job } = useJobDetailQuery(jobId, Boolean(jobId))

  // 从 job 的 interview_duration_minutes 获取面试时长，如果没有则默认15分钟
  const getInitialSeconds = useCallback(() => {
    try {
      const minutes = job?.interview_duration_minutes
      if (minutes != null && Number.isFinite(minutes) && minutes > 0) {
        return Math.floor(minutes * 60)
      }
      return 15 * 60 // 默认15分钟
    } catch {
      return 15 * 60 // 默认15分钟
    }
  }, [job?.interview_duration_minutes])

  const [seconds, setSeconds] = useState(() => getInitialSeconds())

  // 当 job 数据加载后，更新计时器初始值
  useEffect(() => {
    if (job?.interview_duration_minutes) {
      const newSeconds = getInitialSeconds()
      setSeconds(newSeconds)
    }
  }, [job?.interview_duration_minutes, getInitialSeconds])
  useEffect(() => {
    if (!active) return
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(t)
  }, [active, seconds])
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return <div className={`rounded-full bg-black/60 text-white px-3 py-1 text-sm ${className ?? ''}`}>{seconds <= 0 ? '面试即将结束' : `${pad(h)}:${pad(m)}:${pad(s)}`}</div>
}

