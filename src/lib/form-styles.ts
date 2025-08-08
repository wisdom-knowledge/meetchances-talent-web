/**
 * 统一的表单样式类
 * 用于保持整个应用的表单展示一致性
 */

// 表单标签统一样式 - 固定宽度，方便对齐
export const formLabelClass = 'inline-block w-24 text-sm font-medium text-gray-700 flex-shrink-0 '

// 表单行统一样式 - 保证最小高度和间距
export const formRowClass = 'flex items-center gap-3 min-h-[32px]'

// 表单容器样式
export const formContainerClass = 'space-y-4'

// 扩展的表单标签样式变体
export const formLabelVariants = {
  default: formLabelClass,
  wide: 'inline-block w-32 text-sm font-medium text-gray-700 flex-shrink-0',
  narrow: 'inline-block w-20 text-sm font-medium text-gray-700 flex-shrink-0',
  required: formLabelClass + ' after:content-["*"] after:text-red-500 after:ml-1',
} as const

// 表单值区域样式
export const formValueClass = 'flex items-center gap-2 flex-1'

// 表单分组样式
export const formGroupClass = 'border border-gray-200 rounded-lg p-4 space-y-3'
