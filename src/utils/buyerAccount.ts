import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerAddress, BuyerOrder } from '@/api/services/buyerService'
import { resolveOrderTracking } from '@/utils/orderTracking'
import { addressDeliveryMeta, addressLabelIcon, formatAddressDisplay } from '@/utils/buyerAddress'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export const ACTIVE_ORDER_STATUSES = new Set([
  'pending',
  'accepted',
  'preparing',
  'packed',
  'ready_for_delivery',
  'at_pickup',
  'picked_up',
  'out_for_delivery',
])

export function isActiveOrderStatus(status: string) {
  return ACTIVE_ORDER_STATUSES.has(status.toLowerCase())
}

export function canTrackBuyerOrder(
  order?: { status?: string; tracking?: { delivery_assigned?: boolean; is_live_delivery?: boolean } } | null,
) {
  if (order?.tracking?.is_live_delivery != null) {
    return Boolean(order.tracking.is_live_delivery)
  }

  const status = String(order?.status ?? '').toLowerCase()

  if (['at_pickup', 'picked_up', 'out_for_delivery'].includes(status)) {
    return true
  }

  if (status === 'ready_for_delivery') {
    return Boolean(order?.tracking?.delivery_assigned)
  }

  return false
}

export function shouldShowDeliveryEta(
  order?: { status?: string; tracking?: { delivery_assigned?: boolean; is_live_delivery?: boolean; eta_label?: string | null } } | null,
) {
  return canTrackBuyerOrder(order)
}

export function canBuyerCancelOrder(
  order?: { status?: string; tracking?: { delivery_assigned?: boolean } } | null,
  tracking?: { delivery_assigned?: boolean } | null,
) {
  const status = String(order?.status ?? '').toLowerCase()
  if (!isActiveOrderStatus(status) || status === 'out_for_delivery') return false

  const deliveryAssigned = Boolean(
    tracking?.delivery_assigned ?? order?.tracking?.delivery_assigned,
  )

  return !deliveryAssigned
}

export function isCancelledOrderStatus(status: string) {
  return status.toLowerCase() === 'cancelled'
}

export function filterOrdersByTab(orders: BuyerOrder[], tab: 'active' | 'completed') {
  return orders.filter((order) => {
    const status = order.status.toLowerCase()
    return tab === 'active' ? isActiveOrderStatus(status) : !isActiveOrderStatus(status)
  })
}

export function filterOrdersByRecentMonths(orders: BuyerOrder[], months = 3) {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  return orders.filter((order) => {
    const raw = order.created_at ?? order.placed_at
    if (typeof raw !== 'string') return true
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) || date >= cutoff
  })
}

export function orderDateLabel(order: BuyerOrder) {
  const raw = order.created_at ?? order.placed_at
  if (typeof raw !== 'string') return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function orderLabel(order: BuyerOrder) {
  return order.order_number ? `#${order.order_number}` : `#${order.uuid.slice(0, 8).toUpperCase()}`
}

export function activeStatusLabel(
  status: string,
  options?: {
    deliveryAssigned?: boolean
    tracking?: ReturnType<typeof resolveOrderTracking>
    order?: { status?: string; tracking?: { delivery_assigned?: boolean; is_live_delivery?: boolean } }
  },
) {
  const orderLike = options?.order ?? {
    status,
    tracking: options?.tracking as { delivery_assigned?: boolean; is_live_delivery?: boolean } | undefined,
  }
  const tracking =
    options?.tracking ??
    resolveOrderTracking({
      status,
      tracking: options?.deliveryAssigned ? { delivery_assigned: true } : undefined,
    })
  const showEta = shouldShowDeliveryEta(orderLike)

  if (tracking.status_label) {
    if (showEta && tracking.eta_label) {
      return `${tracking.status_label} · ${tracking.eta_label}`
    }
    return tracking.status_label
  }

  const key = status.toLowerCase()
  if (key === 'out_for_delivery') return 'Out for delivery'
  if (key === 'at_pickup') return 'At pickup location'
  if (key === 'picked_up') return 'Order picked up'
  if (key === 'ready_for_delivery') return options?.deliveryAssigned ? 'Courier heading to store' : 'Waiting for courier'
  if (key === 'packed' || key === 'preparing') return 'Being prepared'
  return 'In progress'
}

export function useAddressDeliveryQuote(address: BuyerAddress, canQuote: boolean) {
  const { data } = useQuery({
    queryKey: ['buyer', 'delivery-options', address.uuid],
    queryFn: () => buyerService.getDeliveryOptions(address.uuid),
    enabled: canQuote,
    staleTime: 60_000,
  })

  return useMemo(() => {
    const fallback = addressDeliveryMeta(address)
    const options = data?.data?.options ?? []
    const cheapest = options.reduce<typeof options[number] | null>((best, option) => {
      const charge = option.delivery_charge ?? 0
      if (!best || charge < (best.delivery_charge ?? 0)) return option
      return best
    }, null)

    if (!cheapest) return fallback

    const distanceKm = cheapest.distance_km ?? 0
    const estMinutes = Math.max(15, Math.round(distanceKm * 4 + 12))
    const estHigh = estMinutes + 10

    return {
      est: `${estMinutes}-${estHigh} min`,
      fee:
        address.is_default && (cheapest.delivery_charge ?? 0) === 0
          ? 'Free'
          : formatCurrency(cheapest.delivery_charge ?? 0),
    }
  }, [address, data?.data?.options])
}

export function useOrderSavingsSummary(orders: BuyerOrder[]) {
  return useMemo(() => {
    const savings = orders.reduce((sum, order) => sum + (order.discount ?? 0), 0)
    const delivered = orders.filter((order) => order.status.toLowerCase() === 'delivered').length
    return { savings, delivered }
  }, [orders])
}

export async function reorderOrderItems(orderUuid: string) {
  const response = await buyerService.getOrder(orderUuid)
  const items = response.data?.items ?? []
  let added = 0

  for (const item of items) {
    const productUuid = item.product?.uuid
    if (!productUuid) continue
    await buyerService.addCartItem({ product_uuid: productUuid, quantity: item.quantity })
    added += 1
  }

  return added
}

export async function downloadInvoicePdf(orderUuid: string) {
  try {
    await buyerService.downloadOrderInvoicePdf(orderUuid)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to download PDF'))
  }
}

export async function downloadInvoice(orderUuid: string) {
  return downloadInvoicePdf(orderUuid)
}

export { addressLabelIcon, formatAddressDisplay }
