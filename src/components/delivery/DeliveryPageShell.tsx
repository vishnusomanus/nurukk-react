import { cn } from '@/utils/cn'
import { isDeliveryBottomNavHidden } from '@/components/delivery/DeliveryBottomNav'

export function DeliveryPageShell({
  children,
  className,
  pathname,
}: {
  children: React.ReactNode
  className?: string
  pathname?: string
}) {
  const hideNav = pathname ? isDeliveryBottomNavHidden(pathname) : false
  const bottomPad = hideNav
    ? 'pb-[max(1.5rem,env(safe-area-inset-bottom))]'
    : 'app-page-pad-bottom'

  return (
    <div className={cn('delivery-page-container space-y-4 lg:space-y-6 lg:pt-2', bottomPad, className)}>
      {children}
    </div>
  )
}
