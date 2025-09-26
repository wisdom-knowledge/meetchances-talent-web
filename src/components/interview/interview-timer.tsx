import { useEffect, useState } from 'react'

export function InterviewTimer({ active, className }: { active?: boolean; className?: string }) {
  // 支持通过 URL 参数 ?countdown=分钟数 控制倒计时；缺省为 15 分钟
  const getInitialSeconds = () => {
    try {
      if (typeof window === 'undefined') return 15 * 60
      const sp = new URLSearchParams(window.location.search)
      const v = sp.get('countdown')
      const n = v != null ? Number(v) : NaN
      if (Number.isFinite(n) && n > 0) return Math.floor(n * 60)
      return 15 * 60
    } catch {
      return 15 * 60
    }
  }
  const [seconds, setSeconds] = useState(getInitialSeconds)
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

