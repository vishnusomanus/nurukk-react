import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/api/services'
import { NotificationListItem } from '@/components/common/NotificationListItem'
import { useAuthStore } from '@/store/authStore'
import { getNotificationsPagePath } from '@/utils/notificationNavigation'
import { cn } from '@/utils/cn'

function NotificationsPanel({
  className,
  panelId,
  unread,
  items,
  isLoading,
  markAllPending,
  onMarkAll,
  onMarkRead,
  onNavigate,
  viewAllPath,
  role,
}: {
  className?: string
  panelId: string
  unread: number
  items: Awaited<ReturnType<typeof notificationsService.listNotifications>>['data'] | undefined
  isLoading: boolean
  markAllPending: boolean
  onMarkAll: () => void
  onMarkRead: (uuid: string) => void
  onNavigate: () => void
  viewAllPath: string
  role?: string | null
}) {
  const list = Array.isArray(items) ? items : []

  return (
    <div
      id={panelId}
      role="dialog"
      aria-label="Notifications"
      className={cn(
        'flex max-h-[min(70dvh,32rem)] w-full flex-col overflow-hidden border border-black/[0.06] bg-surface/95 shadow-[0_18px_50px_-18px_rgba(15,40,20,0.35)] backdrop-blur-xl backdrop-saturate-150',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-br from-primary to-primary-container px-4 py-3.5 text-on-primary">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase opacity-80">Inbox</p>
          <h3 className="text-base font-bold leading-tight">Notifications</h3>
        </div>
        <button
          type="button"
          disabled={markAllPending || unread === 0}
          onClick={onMarkAll}
          className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-opacity disabled:opacity-40"
        >
          {markAllPending ? '…' : 'Mark all read'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="space-y-2 px-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <span
              className="material-symbols-outlined mb-2 text-4xl text-outline"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              notifications_off
            </span>
            <p className="text-sm font-semibold text-on-surface">You’re all caught up</p>
            <p className="mt-1 text-xs text-on-surface-variant">New order and delivery alerts show here.</p>
          </div>
        ) : (
          <div className="space-y-1.5 p-2.5">
            {list.map((item) => (
              <NotificationListItem
                key={item.uuid}
                notification={item}
                role={role}
                compact
                onMarkRead={onMarkRead}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant/30 bg-surface-container-low/50 px-3 py-3">
        <Link
          to={viewAllPath}
          onClick={onNavigate}
          className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-on-primary shadow-[0_10px_20px_-10px_rgba(13,99,27,0.55)] transition-transform active:scale-[0.98]"
        >
          View all
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}

export function NotificationsMenu({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const role = useAuthStore((s) => s.user?.role)
  const viewAllPath = getNotificationsPagePath(role)

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 60_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list', 'preview'],
    queryFn: () => notificationsService.listNotifications({ per_page: 8 }),
    enabled: open,
  })

  const markRead = useMutation({
    mutationFn: (uuid: string) => notificationsService.markAsRead(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const unread = countData?.data?.count ?? 0
  const items = data?.data
  const close = () => setOpen(false)

  const sharedPanelProps = {
    panelId,
    unread,
    items,
    isLoading,
    markAllPending: markAll.isPending,
    onMarkAll: () => markAll.mutate(),
    onMarkRead: (uuid: string) => markRead.mutate(uuid),
    onNavigate: close,
    viewAllPath,
    role,
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full transition-colors',
          open
            ? 'bg-primary-container/20 text-primary'
            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
        )}
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={open || unread > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          notifications
        </span>
        {unread > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-secondary-container px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {/* Desktop popover anchored to bell */}
          <div className="absolute right-0 z-50 mt-2 hidden w-[22rem] sm:block">
            <NotificationsPanel {...sharedPanelProps} className="rounded-[1.5rem]" />
          </div>

          {/* Mobile bottom sheet */}
          {typeof document !== 'undefined'
            ? createPortal(
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] sm:hidden"
                    aria-label="Close notifications"
                    onClick={close}
                  />
                  <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] sm:hidden">
                    <NotificationsPanel {...sharedPanelProps} className="rounded-[1.75rem]" />
                  </div>
                </>,
                document.body,
              )
            : null}

          {/* Desktop backdrop (no dim) */}
          <button
            type="button"
            className="fixed inset-0 z-40 hidden sm:block"
            aria-label="Close notifications"
            onClick={close}
          />
        </>
      ) : null}
    </div>
  )
}
