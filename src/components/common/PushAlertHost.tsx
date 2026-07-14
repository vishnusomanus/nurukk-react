import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryService, sellerService } from '@/api/services'
import { subscribePushAlerts, type PushAlertPayload } from '@/native/pushAlertBus'
import { router } from '@/routes'
import { useAuthStore } from '@/store/authStore'
import { isSellerRole, normalizeRole } from '@/utils/authRole'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { humanizeNotificationText } from '@/utils/orderTracking'
import { cn } from '@/utils/cn'

function vibrate(pattern: number | number[] = [80, 40, 80]) {
  try {
    window.navigator.vibrate?.(pattern)
  } catch {
    // ignore
  }
}

function playAlertTone() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.05
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    window.setTimeout(() => {
      osc.stop()
      void ctx.close()
    }, 220)
  } catch {
    // ignore
  }
}

function ctaClass(tone: 'primary' | 'danger' | 'ghost' | 'secondary' = 'primary') {
  return cn(
    'flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60',
    tone === 'primary' &&
      'bg-primary text-on-primary shadow-[0_12px_24px_-10px_rgba(13,99,27,0.55)]',
    tone === 'secondary' &&
      'bg-secondary text-on-secondary shadow-[0_12px_24px_-10px_rgba(150,73,0,0.4)]',
    tone === 'danger' && 'bg-error-container text-on-error-container',
    tone === 'ghost' && 'bg-surface-container-high text-on-surface',
  )
}

export function PushAlertHost() {
  const [alert, setAlert] = useState<PushAlertPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const role = normalizeRole(user?.role)
  const isSeller = isSellerRole(role)
  const isDelivery = role === 'delivery_agent' || role === 'seller_delivery'

  useEffect(() => {
    return subscribePushAlerts((payload) => {
      setError(null)
      setAlert(payload)
      if (payload.highPriority) {
        vibrate([120, 60, 120, 60, 180])
        playAlertTone()
      }
    })
  }, [])

  const acceptSeller = useMutation({
    mutationFn: async (orderUuid: string) => sellerService.updateOrderStatus(orderUuid, 'accepted'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] })
      setAlert(null)
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not accept order')),
  })

  const rejectSeller = useMutation({
    mutationFn: async (orderUuid: string) => sellerService.rejectOrder(orderUuid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] })
      setAlert(null)
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not reject order')),
  })

  const acceptDelivery = useMutation({
    mutationFn: async (orderUuid: string) => deliveryService.acceptOrder(orderUuid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['delivery'] })
      setAlert(null)
      void router.navigate('/delivery')
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not accept delivery')),
  })

  if (!alert || typeof document === 'undefined') return null

  const orderUuid = alert.orderUuid
  const busy =
    acceptSeller.isPending || rejectSeller.isPending || acceptDelivery.isPending
  const showSellerActions = isSeller && alert.type === 'new_order' && !!orderUuid
  const showDeliveryActions =
    isDelivery && (alert.type === 'delivery_available' || alert.type === 'delivery_assigned') && !!orderUuid

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alert.title || 'Alert'}
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Dismiss"
        onClick={() => setAlert(null)}
      />
      <div
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-surface text-on-surface shadow-[0_24px_60px_-20px_rgba(15,40,20,0.45)]',
          alert.highPriority && 'ring-2 ring-primary/30',
        )}
      >
        <div
          className={cn(
            'px-5 py-4 text-on-primary',
            alert.highPriority
              ? 'bg-gradient-to-br from-primary to-primary-container'
              : 'bg-gradient-to-br from-on-surface to-on-surface-variant',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase opacity-80">
                {alert.highPriority ? 'Urgent' : 'Notification'}
              </p>
              <h2 className="mt-1 text-lg font-bold leading-snug">
                {humanizeNotificationText(alert.title || 'Update')}
              </h2>
            </div>
            <span
              className="material-symbols-outlined text-[28px] opacity-90"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {showDeliveryActions ? 'local_shipping' : showSellerActions ? 'receipt_long' : 'notifications'}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {humanizeNotificationText(alert.body)}
          </p>
          {error ? (
            <p className="rounded-2xl bg-error-container/25 px-3 py-2 text-sm text-error">{error}</p>
          ) : null}

          <div className="flex flex-col gap-2">
            {showSellerActions ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => acceptSeller.mutate(orderUuid)}
                  className={ctaClass('primary')}
                >
                  Accept order
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => rejectSeller.mutate(orderUuid)}
                  className={ctaClass('danger')}
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAlert(null)
                    void router.navigate(`/seller/orders/${orderUuid}`)
                  }}
                  className="flex h-11 items-center justify-center text-sm font-semibold text-primary"
                >
                  View order
                </button>
              </>
            ) : null}

            {showDeliveryActions ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => acceptDelivery.mutate(orderUuid)}
                  className={ctaClass('primary')}
                >
                  Accept delivery
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAlert(null)
                    void router.navigate('/delivery')
                  }}
                  className={ctaClass('ghost')}
                >
                  View route
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAlert(null)}
                  className="flex h-11 items-center justify-center text-sm font-semibold text-on-surface-variant"
                >
                  Dismiss
                </button>
              </>
            ) : null}

            {!showSellerActions && !showDeliveryActions ? (
              <button type="button" onClick={() => setAlert(null)} className={ctaClass('primary')}>
                OK
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
