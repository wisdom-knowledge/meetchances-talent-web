export type Pill = { text: string; classes: string }

function normalizeStatus(status?: string | number | null): string {
  if (status == null) return '0'
  const s = typeof status === 'number' ? String(status) : status
  return s.trim()
}

export function mapCurrentNodeStatusToPill(
  statusInput?: string | number | null,
  progress?: number | null,
  totalStep?: number | null
): Pill {
  const status = normalizeStatus(statusInput)
  // 颜色：绿色 #00BD65；红色 #F4490B
  // 0/10/50 -> 进行中；20 -> 审核中；30 -> 通过；40 -> 已拒绝
  if (status === '30') {
    return { text: '已通过', classes: 'bg-[#D7FCE3] text-[#00BD65]' }
  }
  if (status === '40') {
    return { text: '已拒绝', classes: 'bg-[#FFDEDD] text-[#F4490B]' }
  }
  if (status === '20') {
    return { text: '审核中', classes: 'bg-[#4E02E41A] text-[#4E02E4]' }
  }
  const p = typeof progress === 'number' ? progress : 0
  const t = typeof totalStep === 'number' ? totalStep : 0
  return {
    text: `未完成（${p}/${t}）`,
    classes: 'bg-[#FFF6BC] text-[#B28300]',
  }
}


