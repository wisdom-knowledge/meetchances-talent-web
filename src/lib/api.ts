import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://service-dev.meetchances.com/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  // 携带 Cookie 参与鉴权
  withCredentials: true,
})

// 登录地址（通过一个统一的环境变量覆盖）
const LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL ??
  'https://meetchances-boe.authing.cn/oidc/auth?client_id=689c2e77d80278e1a78e6c8b&redirect_uri=https://service-dev.meetchances.com/api/v1/login-callback&response_type=code&scope=openid+profile+email+phone+address+username+offline_access&state=redirect_uri=https://talent.meetchances.com'

// 响应拦截器：统一解包 { status_code, status_msg, data }
api.interceptors.response.use(
  (response) => {
    const payload = response.data
    // 若没有通用外层，直接返回原始数据
    if (!payload || typeof payload !== 'object' || !('status_code' in payload)) {
      return payload
    }

    const { status_code, status_msg, data } = payload as {
      status_code: number
      status_msg?: string
      data: unknown
    }

    if (status_code === 0) {
      return data
    }

    return Promise.reject({ status_code, status_msg })
  },
  (error) => {
    // HTTP 层错误或后端直接返回非 2xx
    const resp = error?.response
    // 处理未登录或登录失效
    if (resp?.status === 401) {
      // 跳转到第三方登录（区分环境）
      const loginUrl = LOGIN_URL
      if (typeof window !== 'undefined') {
        window.location.href = loginUrl
      }
      return Promise.reject(error)
    }
    const payload = resp?.data
    if (payload && typeof payload === 'object' && 'status_code' in payload) {
      const { status_code, status_msg } = payload as {
        status_code: number
        status_msg?: string
      }
      return Promise.reject({ status_code, status_msg })
    }
    return Promise.reject(error)
  }
)


