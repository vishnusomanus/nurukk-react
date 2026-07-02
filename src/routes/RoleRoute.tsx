import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getHomePathForRole, normalizeRole } from '@/utils/authRole'

export function RoleRoute({ roles }: { roles: string[] }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />

  const role = normalizeRole(user.role)
  if (!roles.map(normalizeRole).includes(role)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  return <Outlet />
}
