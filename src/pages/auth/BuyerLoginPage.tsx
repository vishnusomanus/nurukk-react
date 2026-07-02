import { Navigate } from 'react-router-dom'
import { PremiumLoginTemplate } from '@/components/auth/templates/PremiumLoginTemplate'
import { useAuthStore } from '@/store/authStore'
import { getHomePathForRole } from '@/utils/authRole'

export function BuyerLoginPage() {
  const user = useAuthStore((s) => s.user)

  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  return <PremiumLoginTemplate role="buyer" mode="login" />
}
