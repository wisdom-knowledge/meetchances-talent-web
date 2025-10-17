/**
 * 配置：需要隐藏 Mobile 底部 Tab 的路由前缀
 * - 使用前缀匹配：只要 pathname 以某个前缀开始就隐藏
 */
export const HIDE_BOTTOM_TAB_PREFIXES: string[] = [
  '/interview/prepare',
  '/interview/session_view',
  '/finish',
]

/** 判断当前路径是否需要隐藏底部 Tab */
export function shouldHideBottomTab(pathname: string): boolean {
  return HIDE_BOTTOM_TAB_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}


