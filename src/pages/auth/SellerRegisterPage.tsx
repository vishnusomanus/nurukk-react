import { Link, Navigate } from 'react-router-dom'
import { PremiumLoginTemplate } from '@/components/auth/templates/PremiumLoginTemplate'
import { useAuthStore } from '@/store/authStore'
import { getHomePathForRole } from '@/utils/authRole'

export function SellerRegisterPage() {
  const user = useAuthStore((s) => s.user)

  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  return (
    <PremiumLoginTemplate
      role="seller"
      mode="register"
      extraFooter={
        <p className="text-body-md mt-4 font-medium text-on-surface-variant/80">
          Already have an account?{' '}
          <Link to="/login/seller" className="font-bold text-primary hover:opacity-80">
            Sign in
          </Link>
          <span className="mx-2 opacity-40">·</span>
          <Link to="/" className="font-bold text-primary hover:opacity-80">
            Home
          </Link>
        </p>
      }
    />
  )
}
