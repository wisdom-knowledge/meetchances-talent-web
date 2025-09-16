import { createBrowserClient } from '@apmplus/web'
import type { AuthUser, InviteInfo } from '@/stores/authStore'

type ApmCommandFn = (...args: unknown[]) => unknown

let apmClient: ApmCommandFn | null = null
let initialized = false
let started = false
const persistentContext: Record<string, string> = {}
const userContextKeys = new Set<string>()
let userContext: Record<string, string> = {}

// Interview/session custom metrics
let interviewStartMs: number | null = null
let reportedConnect = false
let reportedFirstToken = false

export function markInterviewStart(): void {
  interviewStartMs = performance.now()
  reportedConnect = false
  reportedFirstToken = false
}

export function reportInterviewConnected(extra?: Record<string, string>): void {
  if (!apmClient || reportedConnect) return
  const start = interviewStartMs ?? performance.now()
  const delta = Math.max(0, Math.round(performance.now() - start))
  reportedConnect = true
  apmClient('sendEvent', {
    name: 'connect_time',
    metrics: { value_ms: delta },
    categories: { page: 'session', ...(extra ?? {}) },
    type: 'event',
  })
}

export function reportInterviewFirstToken(extra?: Record<string, string>): void {
  if (!apmClient || reportedFirstToken) return
  const start = interviewStartMs ?? performance.now()
  const delta = Math.max(0, Math.round(performance.now() - start))
  reportedFirstToken = true
  apmClient('sendEvent', {
    name: 'first_token_time',
    metrics: { value_ms: delta },
    categories: { page: 'session', ...(extra ?? {}) },
    type: 'event',
  })
}

// Report when interview record status indicates failure
export function reportRecordFail(roomName: string): void {
  if (!apmClient) return
  apmClient('sendEvent', {
    name: 'record_fail',
    categories: { page: 'session', roomName: String(roomName) },
    type: 'event',
  })
}

// Report when WebSocket (LiveKit) connection takes too long in initial connect
export function reportWsConnectTimeout(durationMs: number, extra?: Record<string, string>): void {
  if (!apmClient) return
  apmClient('sendEvent', {
    name: 'ws_connect_timeout',
    metrics: { duration_ms: Math.max(0, Math.round(durationMs)) },
    categories: { page: 'session', ...(extra ?? {}) },
    type: 'event',
  })
}

// Report when WebSocket (LiveKit) reconnection takes too long
export function reportWsReconnectTimeout(durationMs: number, extra?: Record<string, string>): void {
  if (!apmClient) return
  apmClient('sendEvent', {
    name: 'ws_reconnect_timeout',
    metrics: { duration_ms: Math.max(0, Math.round(durationMs)) },
    categories: { page: 'session', ...(extra ?? {}) },
    type: 'event',
  })
}

/**
 * Report a single thinking duration for the interview session.
 * Event name format: thinking_<round>_ms, metrics.value_ms = duration in ms
 */
export function reportThinkingDuration(round: number, durationMs: number, extra?: Record<string, string>): void {
  if (!apmClient) return
  const safeRound = Math.max(1, Math.floor(round))
  const safeDuration = Math.max(0, Math.round(durationMs))
  apmClient('sendEvent', {
    name: `thinking_${safeRound}_ms`,
    metrics: { value_ms: safeDuration },
    categories: { page: 'session', ...(extra ?? {}) },
    type: 'event',
  })
}

export function initApm(): void {
  if (initialized) return

  const aidStr = import.meta.env.VITE_APM_APP_ID as string | undefined
  const token = import.meta.env.VITE_APM_APP_TOKEN as string | undefined
  if (!aidStr || !token) {
    return
  }
  const aid = Number(aidStr)

  const client = createBrowserClient()
  client('init', { aid, token })

  apmClient = client
  // 在上报前将自定义上下文合并到 common.context
  apmClient('on', 'beforeReport', (ev: unknown) => {
    const e = ev as { extra?: { context?: Record<string, string> } }
    const extra = (e.extra = e.extra || {})
    const ctx = (extra.context = extra.context || {})
    for (const [k, v] of Object.entries(persistentContext)) ctx[k] = v
    for (const [k, v] of Object.entries(userContext)) ctx[k] = v
    return e
  })
  // 在发出前直接写入 sendEvent.common.context，确保可见
  apmClient('on', 'beforeSend', (sendEv: unknown) => {
    const s = sendEv as { common?: { context?: Record<string, string> } }
    const common = (s.common = s.common || {})
    const ctx = (common.context = common.context || {})
    for (const [k, v] of Object.entries(persistentContext)) ctx[k] = v
    for (const [k, v] of Object.entries(userContext)) ctx[k] = v
    return s
  })
  initialized = true
}

export function startApm(): void {
  if (!initialized || started || !apmClient) return
  apmClient('start')
  started = true
}

export function isApmStarted(): boolean {
  return started
}

export function setApmUser(user: AuthUser | null): void {
  if (!initialized || !apmClient) return

  if (user) {
    apmClient('config', { userId: String(user.id) })
  } else {
    apmClient('config', { userId: '' })
  }
}

export function setApmAuth(params: {
  user: AuthUser | null
  inviteInfo: InviteInfo | null
  accessToken: string
}): void {
  if (!initialized || !apmClient) return
  const { user, inviteInfo, accessToken } = params

  setApmUser(user)
  // 清理上一轮用户上下文字段，避免残留
  if (userContextKeys.size) {
    for (const key of userContextKeys) {
      apmClient('context.delete', key)
    }
    userContextKeys.clear()
  }

  const ctx: Record<string, string> = {}
  if (user) {
    ctx.user_id_context = String(user.id)
    if (user.email) ctx.user_email = String(user.email)
    if (user.username) ctx.user_username = String(user.username)
    if (user.full_name) ctx.user_full_name = String(user.full_name)
    if (typeof user.is_active === 'boolean') ctx.user_is_active = String(user.is_active)
    if (typeof user.is_superuser === 'boolean') ctx.user_is_superuser = String(user.is_superuser)
    if (typeof user.is_onboard === 'boolean') ctx.user_is_onboard = String(user.is_onboard)
    if (user.avatar_url) ctx.user_avatar_url = String(user.avatar_url)
    if (user.accountNo) ctx.user_account_no = String(user.accountNo)
    if (user.role) {
      const roles = Array.isArray(user.role) ? user.role : [String(user.role)]
      ctx.user_roles = roles.join(',')
      ctx.user_roles_count = String(roles.filter(Boolean).length)
    }
    if (typeof user.exp !== 'undefined') ctx.user_exp = String(user.exp)
  }
  if (inviteInfo) {
    if (typeof inviteInfo.headhunter_id !== 'undefined') ctx.invite_headhunter_id = String(inviteInfo.headhunter_id)
    if (inviteInfo.headhunter_name) ctx.invite_headhunter_name = String(inviteInfo.headhunter_name)
    if (typeof inviteInfo.job_id !== 'undefined') ctx.invite_job_id = String(inviteInfo.job_id)
  }
  ctx.access_token_present = String(Boolean(accessToken))
  if (accessToken) {
    const suffix = accessToken.slice(-6)
    ctx.access_token_suffix = suffix
    ctx.access_token_length = String(accessToken.length)
  }
  // 逐项设置，避免 merge 兼容性问题
  for (const [k, v] of Object.entries(ctx)) {
    apmClient('context.set', k, v)
    userContextKeys.add(k)
  }
  userContext = ctx
}

export function setApmContext(context: Record<string, unknown>): void {
  if (!initialized || !apmClient) return
  const stringified: Record<string, string> = {}
  for (const [k, v] of Object.entries(context)) {
    if (typeof v === 'string') stringified[k] = v
    else if (typeof v === 'number' || typeof v === 'boolean') stringified[k] = String(v)
    else if (v == null) continue
    else stringified[k] = JSON.stringify(v)
  }
  if (Object.keys(stringified).length > 0) {
    for (const [k, v] of Object.entries(stringified)) {
      persistentContext[k] = v
      apmClient('context.set', k, v)
    }
  }
}


type ApiBusinessErrorParams = {
  path: string
  method?: string
  status_code: number
  status_msg?: string
  payload?: unknown
  query?: unknown
}

function stringifyForCategory(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return '[unserializable]'
  }
}

export function reportApiBusinessError(params: ApiBusinessErrorParams): void {
  if (!apmClient) return
  const { path, method, status_code, status_msg, payload, query } = params
  apmClient('sendEvent', {
    name: 'api_business_error',
    metrics: { status_code: Number(status_code) },
    categories: {
      path: String(path || ''),
      method: String((method || '').toUpperCase()),
      status_msg: String(status_msg || ''),
      payload: stringifyForCategory(payload),
      query: stringifyForCategory(query),
      page: 'api',
    },
    type: 'event',
  })
}

type ApiResponseEventParams = {
  path: string
  method?: string
  request_payload?: unknown
  request_params?: unknown
  request_query?: unknown
  response?: unknown
}

export function reportApiResponse(params: ApiResponseEventParams): void {
  if (!apmClient) return
  const { path, method, request_payload, request_params, request_query, response } = params
  apmClient('sendEvent', {
    name: 'api_response',
    categories: {
      page: 'api',
      path: String(path || ''),
      method: String((method || '').toUpperCase()),
      request_payload: stringifyForCategory(request_payload),
      request_params: stringifyForCategory(request_params),
      request_query: stringifyForCategory(request_query),
      response: stringifyForCategory(response),
    },
    type: 'event',
  })
}

