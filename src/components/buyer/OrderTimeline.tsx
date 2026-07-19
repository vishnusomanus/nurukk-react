import { useMemo } from 'react'
import { formatOrderStatusLabel } from '@/utils/orderTracking'
import { cn } from '@/utils/cn'

export type OrderTimelineEntry = {
  status: string
  at: string
}

/** Buyer-facing milestones — intermediate ops statuses are folded or dropped. */
type MilestoneId =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'courier'
  | 'on_way'
  | 'arriving'
  | 'delivered'
  | 'cancelled'

const MILESTONE_RANK: Record<MilestoneId, number> = {
  placed: 1,
  confirmed: 2,
  preparing: 3,
  courier: 4,
  on_way: 5,
  arriving: 6,
  delivered: 7,
  cancelled: 8,
}

const MILESTONE_LABEL: Record<MilestoneId, string> = {
  placed: 'Order placed',
  confirmed: 'Order confirmed',
  preparing: 'Being prepared',
  courier: 'Courier assigned',
  on_way: 'On the way',
  arriving: 'Arriving soon',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function milestoneForStatus(status: string): MilestoneId | null {
  const value = status.toLowerCase()
  if (value === 'cancelled') return 'cancelled'
  if (value === 'delivered') return 'delivered'
  if (value === 'out_for_delivery' || value === 'reached_customer' || value === 'at_customer') {
    return 'arriving'
  }
  if (value === 'picked_up' || value === 'package_collected' || value === 'collected') {
    return 'on_way'
  }
  if (value === 'ready_for_delivery' || value === 'at_pickup') return 'courier'
  if (value === 'preparing' || value === 'packed') return 'preparing'
  if (value === 'accepted') return 'confirmed'
  if (value === 'pending') return 'placed'
  return null
}

/**
 * Keep only meaningful buyer milestones. Drops intermediate statuses once
 * a later milestone exists (e.g. hide "courier assigned" after "on the way").
 */
export function condenseBuyerTimeline(entries: OrderTimelineEntry[]): Array<
  OrderTimelineEntry & { milestone: MilestoneId; label: string }
> {
  const latestByMilestone = new Map<MilestoneId, OrderTimelineEntry>()

  for (const entry of entries) {
    const milestone = milestoneForStatus(String(entry.status))
    if (!milestone) continue
    latestByMilestone.set(milestone, entry)
  }

  const last = entries[entries.length - 1]
  if (last) {
    const lastMilestone = milestoneForStatus(String(last.status))
    if (lastMilestone) {
      latestByMilestone.set(lastMilestone, last)
    }
  }

  const maxRank = Array.from(latestByMilestone.keys()).reduce(
    (max, id) => Math.max(max, MILESTONE_RANK[id]),
    0,
  )

  // Once the courier has collected / is arriving, hide shop-side courier steps.
  if (maxRank >= MILESTONE_RANK.on_way) {
    latestByMilestone.delete('courier')
  }

  // After delivery (or cancel), keep a short story: placed → … → final.
  // Drop courier; keep preparing only if we never reached on_way.
  if (latestByMilestone.has('delivered') || latestByMilestone.has('cancelled')) {
    latestByMilestone.delete('courier')
  }

  return Array.from(latestByMilestone.entries())
    .sort((a, b) => {
      const byRank = MILESTONE_RANK[a[0]] - MILESTONE_RANK[b[0]]
      if (byRank !== 0) return byRank
      return new Date(a[1].at).getTime() - new Date(b[1].at).getTime()
    })
    .map(([milestone, entry]) => ({
      ...entry,
      milestone,
      label: MILESTONE_LABEL[milestone],
    }))
}

function timelineIcon(milestone: MilestoneId) {
  if (milestone === 'cancelled') return 'cancel'
  if (milestone === 'delivered') return 'task_alt'
  if (milestone === 'arriving') return 'delivery_dining'
  if (milestone === 'on_way') return 'package_2'
  if (milestone === 'courier') return 'local_shipping'
  if (milestone === 'preparing') return 'skillet'
  if (milestone === 'confirmed') return 'verified'
  return 'receipt_long'
}

function formatRelativeTimelineTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatClockTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function OrderTimeline({
  entries,
  currentStatus,
  emptyLabel,
  emptyHint,
  cancelled = false,
  active = false,
}: {
  entries: OrderTimelineEntry[]
  currentStatus?: string
  emptyLabel?: string
  emptyHint?: string
  cancelled?: boolean
  active?: boolean
}) {
  const condensed = useMemo(() => condenseBuyerTimeline(entries), [entries])

  if (condensed.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low/90 px-3.5 py-3.5">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            cancelled ? 'bg-error-container/40 text-error' : 'bg-primary/10 text-primary',
          )}
        >
          <span className="material-symbols-outlined text-[22px]">
            {cancelled ? 'cancel' : active ? 'hourglass_top' : 'check_circle'}
          </span>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface">
            {emptyLabel ?? formatOrderStatusLabel(currentStatus ?? '')}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
            {emptyHint ??
              (active ? 'Updates will appear here as your order moves.' : 'No timeline events yet.')}
          </p>
        </div>
      </div>
    )
  }

  const latestIndex = condensed.length - 1

  return (
    <ol className="relative m-0 list-none p-0">
      {condensed.map((entry, index) => {
        const isLatest = index === latestIndex
        const isPast = index < latestIndex
        const isCancelledStep = entry.milestone === 'cancelled'
        const icon = timelineIcon(entry.milestone)
        const title = entry.label
        const relative = formatRelativeTimelineTime(entry.at)
        const clock = formatClockTime(entry.at)

        return (
          <li key={`${entry.milestone}-${entry.at}-${index}`} className="relative flex gap-3.5">
            <div className="relative flex w-11 shrink-0 flex-col items-center">
              {index < latestIndex ? (
                <span
                  className={cn(
                    'absolute top-11 bottom-[-2px] w-[3px] rounded-full',
                    isCancelledStep ? 'bg-error/35' : 'bg-primary/35',
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  'relative z-[1] flex size-11 items-center justify-center rounded-full transition-colors',
                  isLatest &&
                    !isCancelledStep &&
                    'bg-primary text-on-primary shadow-[0_8px_18px_-8px_rgba(13,99,27,0.55)]',
                  isLatest &&
                    isCancelledStep &&
                    'bg-error text-on-error shadow-[0_8px_18px_-8px_rgba(186,26,26,0.45)]',
                  isPast && !isCancelledStep && 'bg-primary-container/35 text-primary',
                  isPast && isCancelledStep && 'bg-error-container/40 text-error',
                  !isLatest && !isPast && 'bg-surface-container-high text-on-surface-variant',
                )}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isLatest ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {icon}
                </span>
              </span>
            </div>

            <div
              className={cn(
                'min-w-0 flex-1 rounded-2xl px-3.5 py-3',
                isLatest
                  ? isCancelledStep
                    ? 'mb-1 bg-error-container/20 ring-1 ring-error/15'
                    : 'mb-1 bg-primary-container/15 ring-1 ring-primary/15'
                  : 'mb-2 bg-transparent',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[15px] font-bold leading-snug',
                      isLatest
                        ? isCancelledStep
                          ? 'text-error'
                          : 'text-primary'
                        : 'text-on-surface',
                    )}
                  >
                    {title}
                  </p>
                  {isLatest && active && !isCancelledStep ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold tracking-wide text-primary uppercase">
                      <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                      Current
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-on-surface-variant">{relative}</p>
                  {clock ? <p className="mt-0.5 text-[11px] text-outline">{clock}</p> : null}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
