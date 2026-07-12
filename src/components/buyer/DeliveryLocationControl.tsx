import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DeliveryLocationMapSheet } from '@/components/buyer/DeliveryLocationMapSheet'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { useDeliveryLocation } from '@/context/DeliveryLocationProvider'
import type { DeliveryLocationMeta } from '@/context/DeliveryLocationProvider'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
import type { DeliveryCheckResult } from '@/utils/deliveryCheck'
import { formatDeliveryCheckMessage } from '@/utils/deliveryCheck'
import {
  deliveryCheckLabel,
  deliveryCheckSubLabel,
} from '@/utils/deliveryLocationStorage'
import { cn } from '@/utils/cn'

function DeliveryLocationOptionsSheet({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  const { handleProps, sheetStyle } = useSwipeToClose(onClose)

  return createPortal(
    <div
      className="fixed inset-0 z-[70] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Delivery location"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close delivery location"
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[1.75rem] bg-surface px-4 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)]"
        style={sheetStyle}
      >
        <BottomSheetHandle {...handleProps} />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 touch-none" {...handleProps}>
            <h3 className="text-lg font-bold text-on-surface">Delivery location</h3>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              Choose where you want fresh produce delivered.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

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

  const initialMapPosition = useMemo(
    () =>
      stored?.latitude != null && stored?.longitude != null
        ? { lat: stored.latitude, lng: stored.longitude }
        : null,
    [stored?.latitude, stored?.longitude],
  )

  const handleMapClose = useCallback(() => setMapOpen(false), [])
  const handleMapConfirmed = useCallback(
    (result: DeliveryCheckResult, meta: DeliveryLocationMeta) => {
      applyLocation(result, meta)
      setMapOpen(false)
      setOpen(false)
    },
    [applyLocation],
  )

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    if (variant === 'mobile') document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, variant])

  const actions = (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          setMapOpen(true)
        }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-on-primary transition-transform active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[22px]">pin_drop</span>
        Pin location on map
      </button>

      <button
        type="button"
        disabled={locating}
        onClick={() => void detectLocation().then(() => setOpen(false))}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-surface-container-low text-sm font-semibold text-on-surface transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <span className={cn('material-symbols-outlined text-[22px]', locating && 'animate-spin')}>
          my_location
        </span>
        {locating ? 'Detecting location…' : 'Use my current location'}
      </button>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {stored ? (
        <div
          className={cn(
            'rounded-2xl px-3.5 py-3 text-sm leading-snug',
            stored.serviceable
              ? 'bg-primary-container/35 text-primary'
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
        </div>
      ) : null}

      {stored?.max_delivery_radius_km != null ? (
        <p className="text-center text-xs text-on-surface-variant">
          Showing stores within {stored.max_delivery_radius_km} km of your pin.
        </p>
      ) : null}
    </div>
  )

  return (
    <div className={cn('relative', variant === 'mobile' && 'w-full min-w-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          variant === 'mobile'
            ? 'flex w-full min-w-0 items-center gap-1.5 text-left'
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
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] leading-none font-semibold tracking-wide text-on-surface-variant">
                DELIVER TO
              </span>
              <span
                className={cn(
                  'max-w-full truncate text-sm font-bold',
                  locating
                    ? 'text-on-surface-variant'
                    : stored?.serviceable === false
                      ? 'text-error'
                      : 'text-primary',
                )}
              >
                {label}
              </span>
              <span className="max-w-full truncate text-[10px] text-on-surface-variant">{statusHint}</span>
            </div>
            <span className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant">
              expand_more
            </span>
          </>
        ) : (
          <span className={cn('material-symbols-outlined', locating && 'animate-pulse')}>location_on</span>
        )}
      </button>

      {open && variant === 'mobile' ? (
        <DeliveryLocationOptionsSheet onClose={() => setOpen(false)}>{actions}</DeliveryLocationOptionsSheet>
      ) : null}

      {open && variant === 'desktop' ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close delivery location"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-outline-variant bg-surface p-4 shadow-xl">
            <div className="mb-3">
              <h3 className="text-body-lg font-bold text-on-surface">Delivery location</h3>
              <p className="text-body-md text-on-surface-variant">
                Stores are matched by GPS distance from your pin.
              </p>
            </div>
            {actions}
          </div>
        </>
      ) : null}

      <DeliveryLocationMapSheet
        open={mapOpen}
        onClose={handleMapClose}
        initialPosition={initialMapPosition}
        onConfirmed={handleMapConfirmed}
      />
    </div>
  )
}
