import Cookies from 'js-cookie'
import { create } from 'zustand'

const ACCESS_TOKEN = 'thisisjustarandomstring'

export interface AuthUser {
  // 后端 /users/me 返回字段
  id: number
  email: string
  full_name: string
  username?: string
  avatar_url?: string
  phone_number?: string
  is_active: boolean
  is_superuser: boolean
  is_onboard: boolean

  // 兼容历史字段（仅在少量地方使用）
  accountNo?: string
  role?: string[]
  exp?: number
}

export enum AcquistionChannel {
  REFERRAL = 1,
  SOCIAL_MEDIA = 2,
  JOB_PLATFORM = 3,
  OTHER = 4,
}

export enum PartTimeHours {
  HOURS_0_5 = 1,
  HOURS_5_20 = 2,
  HOURS_20_40 = 3,
  HOURS_40_PLUS = 4,
}

export interface TalentParams {
  full_name?: string
  birth_month?: string
  location?: string
  part_time_hours?: PartTimeHours
  acquisition_channel?: AcquistionChannel
  top_skills?: string
}

export interface Talent extends TalentParams {
  email: string
  is_active: boolean
  is_onboard: boolean
  id: number
  username: string
  full_name: string
  phone_number: string
  birth_month: string
  avatar_url: string
  is_superuser: boolean
  // 新增：用于判断是否绑定了微信支付的小程序 openid
  miniprogram_openid?: string
}

export interface InviteInfo {
  headhunter_id?: number
  headhunter_name?: string
  job_id?: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    inviteInfo: InviteInfo | null
    setUser: (user: AuthUser | null) => void
    setInviteInfo: (info: InviteInfo | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const cookieState = Cookies.get(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      inviteInfo: null,
      setInviteInfo: (inviteInfo) =>
        set((state) => ({ ...state, auth: { ...state.auth, inviteInfo } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          Cookies.set(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, inviteInfo: null, accessToken: '' },
          }
        }),
    },
  }
})

// export const useAuth = () => useAuthStore((state) => state.auth)
