import { useEffect } from 'react'
import { imManager } from '@/lib/im'
import { useAuthStore } from '@/stores/authStore'
import type { IMTokenResponse } from '@/lib/api'

/**
 * 火山 IM 初始化 Hook
 * 自动在用户登录后初始化 IM，并在组件卸载时清理
 * @param imTokenData IM Token 数据
 */
export function useIMInit(imTokenData?: IMTokenResponse) {
  const authUser = useAuthStore((s) => s.auth.user)

  useEffect(() => {
    // 如果用户未登录或没有 ID 或没有 token，不初始化
    if (!authUser?.id || !imTokenData?.token) {
      return
    }

    // Token 获取函数 - 返回 string
    const getToken = async (): Promise<string> => {
      return imTokenData.token
    }

    // 初始化 IM
    const userId = String(authUser.id)
    imManager
      .init(userId, getToken)
      .then(() => {
        // IM 初始化成功
      })
      .catch((_error) => {
        // 静默处理错误，IM 初始化失败不影响其他功能
      })

    // 组件卸载时清理
    return () => {
      // 注意：这里不调用 destroy，因为 IM 应该在整个应用生命周期内保持连接
      // 只有在用户登出时才应该销毁
    }
  }, [authUser?.id, imTokenData])
}
