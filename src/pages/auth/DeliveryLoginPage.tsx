import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PremiumLoginTemplate } from '@/components/auth/templates/PremiumLoginTemplate'
import type { OtpRole } from '@/api/services/authService'
import { useAuthStore } from '@/store/authStore'
import { getHomePathForRole } from '@/utils/authRole'

const DELIVERY_ROLE_OPTIONS: { value: OtpRole; label: string; description: string }[] = [
  {
    value: 'delivery_agent',
    label: 'Platform agent',
    description: 'Deliver orders across the marketplace',
  },
  {
    value: 'seller_delivery',
    label: 'Seller staff',
    description: 'Deliver for a specific farm store',
  },
]

export function DeliveryLoginPage() {
  const user = useAuthStore((s) => s.user)
  const [role, setRole] = useState<OtpRole>('delivery_agent')

  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  return (
    <PremiumLoginTemplate
      role={role}
      mode="login"
      headline="Delivery Console"
      subheadline="Sign in with your mobile number to view and manage deliveries."
      roleChoice={{
        value: role,
        options: DELIVERY_ROLE_OPTIONS,
        onChange: setRole,
      }}
      extraFooter={
        role === 'delivery_agent' ? (
          <p className="text-body-md font-medium text-on-surface-variant/80">
            New platform agent?{' '}
            <Link to="/register/delivery" className="font-bold text-primary hover:opacity-80">
              Register here
            </Link>
          </p>
        ) : null
      }
    />
  )
}
