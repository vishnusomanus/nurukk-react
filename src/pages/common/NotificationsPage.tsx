import { Link } from 'react-router-dom'
import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { DeliveryPageShell } from '@/components/delivery/DeliveryPageShell'
import { NotificationsPageContent } from '@/components/common/NotificationsPageContent'
import { useAuthStore } from '@/store/authStore'
import { getHomePathForRole, isAdminRole, isBuyerRole, isSellerRole, normalizeRole } from '@/utils/authRole'

function RoleNotificationsShell({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.user?.role)
  const r = normalizeRole(role)

  if (isBuyerRole(r)) {
    return (
      <BuyerAccountShell title="Notifications" backTo="/buyer/profile">
        {children}
      </BuyerAccountShell>
    )
  }

  if (isSellerRole(r)) {
    return (
      <div className="seller-page-container app-page-pad-bottom space-y-4 lg:space-y-6">
        <div className="mb-1 hidden items-center gap-2 lg:flex">
          <Link to="/seller" className="text-sm font-semibold text-primary">
            Dashboard
          </Link>
          <span className="text-outline">/</span>
          <span className="text-sm text-on-surface-variant">Notifications</span>
        </div>
        {children}
      </div>
    )
  }

  if (r === 'delivery_agent' || r === 'seller_delivery') {
    return (
      <DeliveryPageShell pathname="/delivery/notifications">
        <p className="text-sm text-on-surface-variant">Order and delivery updates for your runs.</p>
        {children}
      </DeliveryPageShell>
    )
  }

  if (isAdminRole(r)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 md:px-8">
        <h1 className="text-headline-lg font-bold text-on-surface">Notifications</h1>
        {children}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <a href={getHomePathForRole(role)} className="mb-4 inline-block text-sm font-semibold text-primary">
        Back
      </a>
      <h1 className="mb-6 text-headline-lg font-bold">Notifications</h1>
      {children}
    </div>
  )
}

export function NotificationsPage() {
  return (
    <RoleNotificationsShell>
      <NotificationsPageContent />
    </RoleNotificationsShell>
  )
}
