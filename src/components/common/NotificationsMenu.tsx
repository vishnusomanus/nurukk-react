import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/api/services'
import { NotificationListItem } from '@/components/common/NotificationListItem'
import { useAuthStore } from '@/store/authStore'
import { getNotificationsPagePath } from '@/utils/notificationNavigation'
import { cn } from '@/utils/cn'

export function NotificationsMenu({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
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

  const unread = countData?.data?.count ?? 0
  const items = data?.data ?? []

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:text-primary"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unread > 0 ? (
          <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg sm:w-96">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
              <h3 className="text-body-lg font-bold">Notifications</h3>
              <button
                type="button"
                disabled={markAll.isPending || unread === 0}
                onClick={() => markAll.mutate()}
                className="text-label-md text-primary disabled:opacity-50"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <p className="px-4 py-6 text-center text-body-md text-on-surface-variant">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-body-md text-on-surface-variant">No notifications</p>
              ) : (
                items.map((item) => (
                  <NotificationListItem
                    key={item.uuid}
                    notification={item}
                    role={role}
                    compact
                    onMarkRead={(uuid) => markRead.mutate(uuid)}
                    onNavigate={() => setOpen(false)}
                  />
                ))
              )}
            </div>
            <div className="border-t border-outline-variant px-4 py-3">
              <Link
                to={viewAllPath}
                onClick={() => setOpen(false)}
                className="text-label-md flex items-center justify-center gap-1 font-semibold text-primary"
              >
                View all notifications
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
