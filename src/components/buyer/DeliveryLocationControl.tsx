import { useState } from 'react'
import { DeliveryLocationMapSheet } from '@/components/buyer/DeliveryLocationMapSheet'
import { useDeliveryLocation } from '@/context/DeliveryLocationProvider'
import { formatDeliveryCheckMessage } from '@/utils/deliveryCheck'
import {
  deliveryCheckLabel,
  deliveryCheckSubLabel,
} from '@/utils/deliveryLocationStorage'
import { cn } from '@/utils/cn'

export function DeliveryLocationControl({
  variant = 'desktop',
  className,
}: {
  variant?: 'desktop' | 'mobile'
  className?: string
}) {
  const { stored, locating, error, detectLocation, applyLocation } = useDeliveryLocation()
  const [open, setOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  const label = deliveryCheckLabel(stored, locating)
  const statusHint = locating
    ? 'Finding nearby stores'
    : error
      ? 'Location unavailable'
      : deliveryCheckSubLabel(stored, locating)

  const initialMapPosition =
    stored?.latitude != null && stored?.longitude != null
      ? { lat: stored.latitude, lng: stored.longitude }
      : null

  const panel = (
    <div
      className={cn(
        'z-50 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg',
        variant === 'mobile'
          ? 'fixed inset-x-4 bottom-24 mx-auto max-w-lg'
          : 'absolute right-0 mt-2 w-80',
      )}
    >
      <div className="border-b border-outline-variant px-4 py-3">
        <h3 className="text-body-lg font-bold text-on-surface">Delivery location</h3>
        <p className="text-body-md text-on-surface-variant">
          Stores are matched by GPS distance from your pin.
        </p>
      </div>
      <div className="space-y-3 p-4">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setMapOpen(true)
          }}
          className="text-body-md flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary-container/30 px-4 py-2.5 font-semibold text-primary"
        >
          <span className="material-symbols-outlined">pin_drop</span>
          Pin location on map
        </button>

        <button
          type="button"
          disabled={locating}
          onClick={() => void detectLocation().then(() => setOpen(false))}
          className="text-body-md flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 font-semibold text-on-surface disabled:opacity-60"
        >
          <span className={cn('material-symbols-outlined', locating && 'animate-spin')}>my_location</span>
          {locating ? 'Detecting location…' : 'Use my current location'}
        </button>

        {error ? <p className="text-body-md text-error">{error}</p> : null}

        {stored ? (
          <p
            className={cn(
              'text-body-md rounded-lg px-3 py-2',
              stored.serviceable
                ? 'bg-primary-container/30 text-primary'
                : 'bg-surface-container-low text-on-surface-variant',
            )}
          >
            {formatDeliveryCheckMessage({
              is_serviceable: stored.serviceable,
              delivery_charge: stored.delivery_charge,
              nearest_store_km: stored.nearest_store_km,
              max_delivery_radius_km: stored.max_delivery_radius_km,
              reason: stored.reason,
            })}
          </p>
        ) : null}

        {stored?.max_delivery_radius_km != null ? (
          <p className="text-label-md text-on-surface-variant">
            Showing stores within {stored.max_delivery_radius_km} km of your location.
          </p>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          variant === 'mobile'
            ? 'flex items-center gap-1 text-left'
            : 'rounded-full p-2 text-on-surface-variant transition-colors hover:text-primary',
        )}
        aria-label="Set delivery location"
        aria-expanded={open}
        title={variant === 'desktop' ? `${label} · ${statusHint}` : undefined}
      >
        {variant === 'mobile' ? (
          <>
            <span className={cn('material-symbols-outlined text-primary', locating && 'animate-pulse')}>
              location_on
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] leading-none font-semibold tracking-wide text-on-surface-variant">
                DELIVER TO
              </span>
              <span
                className={cn(
                  'max-w-[8rem] truncate text-sm font-bold',
                  locating ? 'text-on-surface-variant' : stored?.serviceable === false ? 'text-error' : 'text-primary',
                )}
              >
                {label}
              </span>
              <span className="max-w-[8rem] truncate text-[10px] text-on-surface-variant">{statusHint}</span>
            </div>
          </>
        ) : (
          <span className={cn('material-symbols-outlined', locating && 'animate-pulse')}>location_on</span>
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close delivery location"
            onClick={() => setOpen(false)}
          />
          {panel}
        </>
      ) : null}

      <DeliveryLocationMapSheet
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialPosition={initialMapPosition}
        onConfirmed={(result, meta) => {
          applyLocation(result, meta)
          setMapOpen(false)
          setOpen(false)
        }}
      />
    </div>
  )
}
