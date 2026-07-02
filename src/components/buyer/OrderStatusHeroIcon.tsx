import { cn } from '@/utils/cn'

type OrderStatusHeroIconProps = {
  active: boolean
  delivered?: boolean
  cancelled?: boolean
}

export function OrderStatusHeroIcon({ active, delivered, cancelled }: OrderStatusHeroIconProps) {
  const showTracking = active && !cancelled
  const showSuccess = !active && !cancelled
  const icon = cancelled ? 'cancel' : showTracking ? 'local_shipping' : 'check_circle'

  return (
    <div
      className="order-status-hero relative mx-auto mb-4 h-24 w-24 lg:h-28 lg:w-28"
      aria-hidden
    >
      {showSuccess ? (
        <>
          <span className="order-status-hero__ring order-status-hero__ring--1" />
          <span className="order-status-hero__ring order-status-hero__ring--2" />
          <span className="order-status-hero__ring order-status-hero__ring--3" />
        </>
      ) : showTracking ? (
        <span className="order-status-hero__orbit" />
      ) : null}

      <div
        className={cn(
          'order-status-hero__circle relative flex h-full w-full items-center justify-center rounded-full',
          cancelled && 'bg-error-container text-error order-status-hero__circle--success',
          showTracking && 'bg-primary-container text-on-primary-container order-status-hero__circle--tracking',
          showSuccess && 'bg-primary-container text-on-primary-container order-status-hero__circle--success',
          delivered && 'order-status-hero__circle--delivered',
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined text-[48px] lg:text-[56px]',
            showTracking && 'order-status-hero__icon--tracking',
            (showSuccess || cancelled) && 'order-status-hero__icon--success',
          )}
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
        >
          {icon}
        </span>
      </div>
    </div>
  )
}
