import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
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
      <div className="stitch-marketplace px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-headline-lg mb-6 font-bold text-on-surface">Notifications</h1>
          {children}
        </div>
      </div>
    )
  }

  if (isAdminRole(r)) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-headline-lg mb-6 font-bold text-on-surface">Notifications</h1>
          {children}
        </div>
      </div>
    )
  }

  if (r === 'delivery_agent' || r === 'seller_delivery') {
    return (
      <div className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-headline-lg mb-6 font-bold text-on-surface">Notifications</h1>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <a href={getHomePathForRole(role)} className="text-label-md mb-4 inline-block text-primary">
        Back
      </a>
      <h1 className="text-headline-lg mb-6 font-bold">Notifications</h1>
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
