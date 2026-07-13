import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryService, sellerService } from '@/api/services'
import { subscribePushAlerts, type PushAlertPayload } from '@/native/pushAlertBus'
import { router } from '@/routes'
import { useAuthStore } from '@/store/authStore'
import { isSellerRole, normalizeRole } from '@/utils/authRole'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={alert.title || 'Alert'}
    >
      <div
        className={cn(
          'w-full max-w-md overflow-hidden rounded-3xl bg-surface text-on-surface shadow-2xl',
          alert.highPriority && 'ring-2 ring-primary/40',
        )}
      >
        <div className="bg-primary px-5 py-4 text-on-primary">
          <p className="text-[11px] font-semibold tracking-wide uppercase opacity-80">
            {alert.highPriority ? 'Urgent' : 'Notification'}
          </p>
          <h2 className="mt-1 text-lg font-bold leading-snug">{alert.title || 'Update'}</h2>
        </div>
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm leading-relaxed text-on-surface-variant">{alert.body}</p>
          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="flex flex-col gap-2">
            {showSellerActions ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => acceptSeller.mutate(orderUuid)}
                  className="flex h-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary disabled:opacity-60"
                >
                  Accept order
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => rejectSeller.mutate(orderUuid)}
                  className="flex h-12 items-center justify-center rounded-2xl bg-error-container text-sm font-bold text-on-error-container disabled:opacity-60"
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
                  className="flex h-11 items-center justify-center rounded-2xl text-sm font-semibold text-primary"
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
                  className="flex h-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary disabled:opacity-60"
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
                  className="flex h-12 items-center justify-center rounded-2xl bg-surface-container-high text-sm font-bold"
                >
                  View route
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAlert(null)}
                  className="flex h-11 items-center justify-center rounded-2xl text-sm font-semibold text-on-surface-variant"
                >
                  Dismiss
                </button>
              </>
            ) : null}

            {!showSellerActions && !showDeliveryActions ? (
              <button
                type="button"
                onClick={() => setAlert(null)}
                className="flex h-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary"
              >
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
