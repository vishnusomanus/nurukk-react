import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { router } from '@/routes'
import { useThemeStore } from '@/store/themeStore'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { PushAlertHost } from '@/components/common/PushAlertHost'
import { useHighPriorityNotificationPoll } from '@/hooks/useHighPriorityNotificationPoll'

function PushBootstrap() {
  const token = useAuthStore((s) => s.token)
  useHighPriorityNotificationPoll()

  // Native: request FCM permission + token ASAP (before login) so background
  // pushes work after the first open. Channels are also created in MainActivity.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('@/native/pushNotifications')
        .then((m) => m.initPushNotifications())
        .catch((err) => console.warn('[push] early init failed', err))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [])

  // Local tray helpers (permission UX smoke test).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('@/native/systemTrayNotifications')
        .then(async (m) => {
          await m.initSystemTrayNotifications()
        })
        .catch((err) => console.warn('[tray] deferred init failed', err))
    }, 800)
    return () => window.clearTimeout(timer)
  }, [])

  // Sync FCM token to API once the user is authenticated.
  useEffect(() => {
    if (!token) return
    const timer = window.setTimeout(() => {
      void import('@/native/pushNotifications')
        .then((m) => m.syncPushRegistration())
        .catch((err) => console.warn('[push] deferred sync failed', err))
    }, 600)
    return () => window.clearTimeout(timer)
  }, [token])

  return <PushAlertHost />
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)
  const initUser = useAuth((s) => s.initUser)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    initUser()
  }, [initUser])

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
          },
        },
      }),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <PushBootstrap />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
