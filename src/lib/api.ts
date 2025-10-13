import axios from 'axios'
import { Talent, TalentParams } from '@/stores/authStore'
import { reportApiBusinessError, reportApiResponse, userEvent } from '@/lib/apm'
import { noTalentMeRoutes } from '@/components/layout/data/sidebar-data'
import { getReferralParams } from '@/lib/referral'
import { detectRuntimeEnvSync } from '@/lib/env'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'https://service-dev.meetchances.com/api/v1'

const TARGETED_API_KEYWORDS = [
  'connection-details',
  'interview_record_status',
  '/node/action',
  'job_apply_progress',
] as const

// localStorage 键名：用于存储最近一次 "/talent/me" 的用户信息
const LOCAL_STORAGE_USER_KEY = 'talent_current_user'

function handleTalentMeSideEffects(user: Talent): void {
  if (typeof window === 'undefined') return
  // 读取旧用户
  let prevUser: unknown = null
  try {
    const prevStr = window.localStorage.getItem(LOCAL_STORAGE_USER_KEY)
    if (prevStr) prevUser = JSON.parse(prevStr)
  } catch (_e) {
    void _e
  }

  // 存储新用户
  try {
    window.localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user))
  } catch (_e) {
    void _e
  }

  // 对比 id，不同视为新用户，进行来源上报
  const prevId = (prevUser as { id?: number } | null)?.id
  const newId = (user as { id?: number } | null)?.id
  const isNewUser = Boolean(newId) && prevId !== newId
  if (!isNewUser) return

  const { referral_source, referral_uid } = getReferralParams()
  // APM 上报用户注册事件
  userEvent('user_register', '用户注册', {
    user_id: newId,
    referral_source,
    referral_uid,
  })
  if (!referral_source && !referral_uid) return

  // 忽略上报结果与错误
  api.patch('/talent/me', { referral_source, referral_uid }).catch(() => {})
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  // 携带 Cookie 参与鉴权
  withCredentials: true,
  // 无论状态码为何都返回到成功分支，便于拿到 response.status 做统一处理
  validateStatus: () => true,
})

// 登录地址（通过一个统一的环境变量覆盖）
const LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL

type WxWithMiniProgram = { miniProgram?: { redirectTo?: (opts: { url: string }) => void } }

// 统一处理未登录/登录失效后的跳转逻辑
function handleUnauthorizedRedirect(): void {
  if (typeof window === 'undefined') return
  const isSpecialPage = noTalentMeRoutes.includes(window.location.pathname)
  if (isSpecialPage) return

  try {
    const env = detectRuntimeEnvSync()
    if (env === 'wechat-miniprogram') {
      // 在小程序内，使用小程序路由跳转
      const wxAny = (window as unknown as { wx?: unknown }).wx as
        | undefined
        | WxWithMiniProgram
      const target = '/pages/authorize/authorize'
      const url = target.startsWith('/') ? target : `/${target}`
      wxAny?.miniProgram?.redirectTo?.({ url })
      return
    }
  } catch (_e) {
    // ignore
  }

  const loginUrl = LOGIN_URL
  if (loginUrl) {
    window.location.href = loginUrl
  }
}

// 响应拦截器：统一解包 { status_code, status_msg, data }
api.interceptors.response.use(
  (response) => {
    const { status } = response
    const payload = response.data
    const { config } = response
    const urlStr = String(config?.url ?? '')
    const methodStr = String((config?.method ?? '').toUpperCase())
    const paramsUnknown = (config as unknown as { params?: unknown })?.params
    const dataUnknown = config?.data
    // 明确处理未登录/登录失效
    if (status === 401) {
      handleUnauthorizedRedirect()
      return Promise.reject({ status_code: 401, status_msg: 'Unauthorized' })
    }
    // 若没有通用外层，直接返回原始数据
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('status_code' in payload)
    ) {
      // 对于非 2xx 的 HTTP 状态，抛出错误；否则返回数据
      if (status >= 200 && status < 300) {
        // 针对特定接口：成功也上报响应
        if (TARGETED_API_KEYWORDS.some((k) => urlStr.includes(k))) {
          reportApiResponse({
            path: urlStr,
            method: methodStr,
            request_payload: dataUnknown,
            request_params: paramsUnknown,
            request_query: paramsUnknown,
            response: payload,
          })
        }
        return payload
      }
      return Promise.reject({
        status_code: status,
        status_msg: 'Request failed',
      })
    }

    const { status_code, status_msg, data } = payload as {
      status_code: number
      status_msg?: string
      data: unknown
    }

    if (status_code === 0) {
      // 针对特定接口：成功也上报响应
      if (TARGETED_API_KEYWORDS.some((k) => urlStr.includes(k))) {
        reportApiResponse({
          path: urlStr,
          method: methodStr,
          request_payload: dataUnknown,
          request_params: paramsUnknown,
          request_query: paramsUnknown,
          response: payload,
        })
      }

      // 业务成功：如果是 GET /talent/me，则执行本地存储与新用户来源上报逻辑
      try {
        const isTalentMeGet = urlStr.includes('/talent/me') && methodStr === 'GET'
        if (isTalentMeGet) handleTalentMeSideEffects(data as Talent)
      } catch (_e) {
        void _e
      }
      return data
    }

    // 业务错误上报
    reportApiBusinessError({
      path: urlStr,
      method: methodStr,
      status_code,
      status_msg,
      payload: dataUnknown,
      query: paramsUnknown,
    })

    // 针对特定接口：失败也上报响应
    if (TARGETED_API_KEYWORDS.some((k) => urlStr.includes(k))) {
      reportApiResponse({
        path: urlStr,
        method: methodStr,
        request_payload: dataUnknown,
        request_params: paramsUnknown,
        request_query: paramsUnknown,
        response: payload,
      })
    }

    return Promise.reject({ status_code, status_msg })
  },
  (error) => {
    // HTTP 层错误或后端直接返回非 2xx
    // 跳转到第三方登录（区分环境）
    return Promise.reject(error)
  }
)

export interface CurrentUserResponse {
  email: string
  is_active: boolean
  is_superuser: boolean
  full_name: string
  id: number
}

export async function fetchTalentMe(): Promise<Talent> {
  return api.get('/talent/me') as unknown as Promise<Talent>
}

export async function fetchChangeTalnet(params: TalentParams): Promise<Talent> {
  const raw = await api.patch('/talent/me', params)
  return raw as unknown as Promise<Talent>
}

/**
 * 微信签名响应接口
 */
export interface WeChatSignatureResponse {
  status_code: number
  status_msg: string
  data: {
    timestamp: number
    noncestr: string
    ticket: string
    signature: string
  }
}

/**
 * 获取微信JS-SDK签名
 */
export async function fetchWeChatSignature(
  url: string
): Promise<WeChatSignatureResponse> {
  return api.get(`/wechat/sign`, {
    params: {
      url,
    },
  }) as unknown as Promise<WeChatSignatureResponse>
}