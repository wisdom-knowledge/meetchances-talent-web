export const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) {
    return '-'
  }
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

export const formatHours = (hours?: number | string | null) => {
  // 兼容后端返回字符串场景，统一转为 number
  const numeric =
    typeof hours === 'string'
      ? Number(hours.trim())
      : hours

  if (numeric === undefined || numeric === null) return '-'
  if (typeof numeric !== 'number' || Number.isNaN(numeric)) return '-'
  if (numeric <= 0) return '-'

  const fixed = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2)
  return `${fixed.replace(/\.00$/, '')}小时`
}

export const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}


