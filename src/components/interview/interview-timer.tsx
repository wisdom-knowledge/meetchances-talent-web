import { useEffect, useState } from 'react'

export function InterviewTimer({ active, className }: { active?: boolean; className?: string }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [active])
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return <div className={`rounded-full bg-black/60 text-white px-3 py-1 text-sm ${className ?? ''}`}>{`${pad(h)}:${pad(m)}:${pad(s)}`}</div>
}


