import { useDeliveryLocation } from '@/context/DeliveryLocationProvider'
import { cn } from '@/utils/cn'

type NoStoresNearbyCardProps = {
  className?: string
  /** Force show even if delivery check is still loading / missing. */
  force?: boolean
}

export function NoStoresNearbyCard({ className, force = false }: NoStoresNearbyCardProps) {
  const { stored, locating } = useDeliveryLocation()

  const outOfRange = Boolean(stored && !stored.serviceable)
  if (!force && (locating || !outOfRange)) return null

  const area = stored?.city?.trim() || stored?.pincode || 'your area'
  const maxKm = stored?.max_delivery_radius_km

  const openLocationPicker = () => {
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Set delivery location"]',
    )
    trigger?.click()
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative px-5 pt-8 pb-6 text-center sm:px-8">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 size-40 -translate-x-1/2 rounded-full bg-primary-container/10 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-primary-container/15">
          <span
            className="material-symbols-outlined text-[40px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            storefront
          </span>
          <span className="absolute -right-0.5 -bottom-0.5 flex size-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </span>
        </div>

        <p className="text-label-md relative font-bold tracking-wide text-primary uppercase">
          Coming soon
        </p>
        <h3 className="relative mt-1 text-xl font-bold text-on-surface sm:text-2xl">
          We&apos;ll be available here soon
        </h3>
        <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant">
          Fresh farm stores aren&apos;t delivering to{' '}
          <span className="font-semibold text-on-surface">{area}</span> yet
          {maxKm != null ? <> within {maxKm} km</> : null}. We&apos;re expanding quickly — try a
          nearby pin, or check back shortly.
        </p>

        <div className="relative mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={openLocationPicker}
            className="flex h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-on-primary transition-transform active:scale-[0.98] sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">edit_location_alt</span>
            Change location
          </button>
          <p className="text-xs text-on-surface-variant">
            Or keep browsing — new farms appear as we grow
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-outline-variant/40 bg-surface-container-low/60">
        {[
          { icon: 'eco', label: 'Farm fresh' },
          { icon: 'local_shipping', label: 'Local delivery' },
          { icon: 'diversity_2', label: 'More stores soon' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1 px-2 py-3 text-center first:border-r last:border-l border-outline-variant/40"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">{item.icon}</span>
            <span className="text-[10px] font-semibold text-on-surface-variant">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
