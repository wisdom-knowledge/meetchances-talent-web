export const salaryTypeMapping: Record<'hour' | 'day' | 'month' | 'year', string> = {
  hour: '时',
  day: '日',
  month: '月',
  year: '年',
}

export const salaryTypeUnitMapping: Record<'hour' | 'day' | 'month' | 'year', string> = {
  ...salaryTypeMapping,
  hour: '小时',
}

export const jobTypeMapping: Record<'full_time' | 'part_time' | 'mock_job', string> = {
  full_time: '全职',
  part_time: '兼职',
  mock_job: '模拟面试',
}
