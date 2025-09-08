import { useEffect, useState } from 'react'

export function InterviewTimer({ active, className }: { active?: boolean; className?: string }) {
  // 固定 15 分钟倒计时（900 秒）
  const [seconds, setSeconds] = useState(1 * 60)
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


