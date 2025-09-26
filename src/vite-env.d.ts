/// <reference types="vite/client" />

// 增加第三方库的最小类型声明，避免 TS 提示缺失
declare module 'html-to-image' {
  export function toPng(node: HTMLElement, options?: { pixelRatio?: number; cacheBust?: boolean }): Promise<string>
}

interface ImportMetaEnv {
  readonly VITE_AUTH_LOGIN_URL?: string
  readonly VITE_INVITE_REDIRECT_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_RTC_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
