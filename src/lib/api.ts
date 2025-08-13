import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://service-dev.meetchances.com/api/v1',
  headers: {
    Accept: 'application/json',
  },
  withCredentials: false,
})

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


