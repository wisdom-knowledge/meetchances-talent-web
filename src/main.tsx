import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { handleServerError } from '@/utils/handle-server-error'
import { FontProvider } from './context/font-context'
import { ThemeProvider } from './context/theme-context'
import './index.css'
// Generated Routes
import { routeTree } from './routeTree.gen'
import { initApm, startApm, isApmStarted, setApmAuth, setApmContext } from '@/lib/apm'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error('Session expired!')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          router.navigate({ to: '/500' })
        }
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Init APM as early as possible
initApm()
{
  const { user, inviteInfo, accessToken } = useAuthStore.getState().auth
  setApmAuth({ user, inviteInfo, accessToken })
  const appEnv = (import.meta.env.VITE_APP_ENV as string) || (import.meta.env.PROD ? 'prod' : 'dev')
  setApmContext({ env: appEnv })
  setApmContext({ app: 'talent' })
  // 初始化 APM context.fr：首次进入页面时读取 `_fr`
  try {
    let fr: string | null = null
    fr = localStorage.getItem('_fr')
    let shareUserId: string | null = null
    shareUserId = localStorage.getItem('shareUserId')
    const sp = new URLSearchParams(window.location.search)
    // 将 URL 中的通用访问令牌写入 Cookie（domain=.meetchances.com）
    {
      const writeTokenCookie = (paramName: string) => {
        const tokenFromUrl = sp.get(paramName)
        if (!tokenFromUrl) return
        const trimmed = tokenFromUrl.trim()
        if (!trimmed) return
        const cookieParts = [
          `${paramName}=${encodeURIComponent(trimmed)}`,
          'path=/',
          'domain=.meetchances.com',
        ]
        if (window.location.protocol === 'https:') cookieParts.push('Secure')
        document.cookie = cookieParts.join('; ')
      }

      writeTokenCookie('boe_talent_access_token')
      writeTokenCookie('prod_talent_access_token')
    }
    if (!fr) {
      const fromUrl = sp.get('_fr')
      if (fromUrl && fromUrl.trim()) {
        fr = fromUrl.trim()
        localStorage.setItem('_fr', fr)
      }
    }
    if (!shareUserId) {
      const suid = sp.get('user')
      if (suid && suid.trim()) {
        shareUserId = suid.trim()
        localStorage.setItem('shareUserId', shareUserId.trim())
      }
    }
    if (fr) setApmContext({ fr })
    if (shareUserId) setApmContext({ 'share_user_id': shareUserId })
  } catch (_e) {
    // intentionally ignored: reading URL/localStorage can fail in restricted environments
  }
  if (user) startApm()
}

// Sync user changes to APM
useAuthStore.subscribe((state) => {
  const { user, inviteInfo, accessToken } = state.auth
  setApmAuth({ user, inviteInfo, accessToken })
  const appEnv = (import.meta.env.VITE_APP_ENV as string) || (import.meta.env.PROD ? 'prod' : 'dev')
  setApmContext({ env: appEnv })
  setApmContext({ app: 'talent' })
  if (user && !isApmStarted()) startApm()
})

// fallback: 如果 3 秒后仍未有 user，则启动以避免数据缺失
setTimeout(() => {
  if (!isApmStarted()) startApm()
}, 3000)

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
          <FontProvider>
            <RouterProvider router={router} />
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
