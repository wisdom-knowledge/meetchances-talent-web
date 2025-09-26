/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_LOGIN_URL?: string
  readonly VITE_INVITE_REDIRECT_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_RTC_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
