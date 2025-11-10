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

export const formatHours = (hours?: number) => {
  if (hours === undefined || hours === null) return '-'
  if (hours <= 0) return '-'
  const fixed = Number.isInteger(hours) ? String(hours) : hours.toFixed(2)
  return `${fixed.replace(/\.00$/, '')}小时`
}


