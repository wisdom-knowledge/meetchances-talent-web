import { createBrowserClient } from '@apmplus/web'
import type { AuthUser, InviteInfo } from '@/stores/authStore'

type ApmCommandFn = (command: string, payload?: Record<string, unknown>) => void

let apmClient: ApmCommandFn | null = null
let initialized = false

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
  client('start')

  apmClient = client
  initialized = true
}

export function setApmUser(user: AuthUser | null): void {
  if (!initialized || !apmClient) return

  if (user) {
    apmClient('setUser', {
      userId: String(user.id),
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      is_active: user.is_active,
      is_superuser: user.is_superuser,
      is_onboard: user.is_onboard,
      avatar_url: user.avatar_url,
      accountNo: user.accountNo,
      role: user.role,
      exp: user.exp,
    })
    apmClient('config', {
      user_snapshot: user,
    })
  } else {
    apmClient('setUser', { userId: '' })
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
  apmClient('config', {
    invite_info: inviteInfo ?? undefined,
    access_token_present: Boolean(accessToken),
  })
}

export function setApmContext(context: Record<string, unknown>): void {
  if (!initialized || !apmClient) return
  apmClient('config', context)
}


