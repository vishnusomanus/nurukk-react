import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { router } from '@/routes'
import { useThemeStore } from '@/store/themeStore'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { PushAlertHost } from '@/components/common/PushAlertHost'
import { useHighPriorityNotificationPoll } from '@/hooks/useHighPriorityNotificationPoll'
import { syncPushRegistration } from '@/native/pushNotifications'

function PushBootstrap() {
  const token = useAuthStore((s) => s.token)
  useHighPriorityNotificationPoll()

  useEffect(() => {
    if (!token) return
    void syncPushRegistration()
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
