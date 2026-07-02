import { useDeliveryScopeLabel } from '@/hooks/useDeliveryScopeParams'

export function DeliveryRangeBanner({ className }: { className?: string }) {
  const label = useDeliveryScopeLabel()

  if (!label) return null

  return (
    <p
      className={
        className ??
        'rounded-xl border border-primary/20 bg-primary-container/15 px-4 py-3 text-body-md text-on-surface'
      }
    >
      <span className="material-symbols-outlined mr-2 align-middle text-[18px] text-primary">near_me</span>
      {label}
    </p>
  )
}
