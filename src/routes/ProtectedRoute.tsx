import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getLogoutRedirectPath } from '@/utils/authPaths'

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  if (!token) {
    return <Navigate to={getLogoutRedirectPath(location.pathname)} replace />
  }
  return <Outlet />
}
