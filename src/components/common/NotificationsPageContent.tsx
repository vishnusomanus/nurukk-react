import { useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/api/services'
import type { AppNotification } from '@/api/services/notificationsService'
import { NotificationListItem } from '@/components/common/NotificationListItem'
import { useAuthStore } from '@/store/authStore'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

type NotificationFilter = 'all' | 'unread'

export function NotificationsPageContent() {
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.user?.role)
  const [filter, setFilter] = useState<NotificationFilter>('all')

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 60_000,
  })

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', 'list', filter],
    queryFn: ({ pageParam = 1 }) =>
      notificationsService.listNotifications({
        page: pageParam,
        per_page: 20,
        unread_only: filter === 'unread',
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = extractPaginationMeta(lastPage)
      if (!meta || meta.current_page >= meta.last_page) return undefined
      return meta.current_page + 1
    },
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
  const notifications = useMemo(
    () =>
      (data?.pages.flatMap((page) => extractRows(page.data)) ?? []) as AppNotification[],
    [data?.pages],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                'text-label-md rounded-full px-4 py-2 capitalize transition-colors',
                filter === tab
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface',
              )}
            >
              {tab}
              {tab === 'unread' && unread > 0 ? ` (${unread})` : ''}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={markAll.isPending || unread === 0}
          onClick={() => markAll.mutate()}
          className="text-label-md self-start font-semibold text-primary disabled:opacity-50 sm:self-auto"
        >
          {markAll.isPending ? 'Updating…' : 'Mark all as read'}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-outline-variant bg-surface p-10 text-center text-on-surface-variant">
          Loading notifications…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/5 p-6 text-error">
          {getApiErrorMessage(error, 'Could not load notifications')}
        </div>
      ) : null}

      {!isLoading && !error && notifications.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface p-10 text-center">
          <span className="material-symbols-outlined mb-3 text-[40px] text-outline">notifications_off</span>
          <p className="text-body-lg font-semibold text-on-surface">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-body-sm mt-1 text-on-surface-variant">
            Order updates and delivery alerts will appear here.
          </p>
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationListItem
              key={notification.uuid}
              notification={notification}
              role={role}
              onMarkRead={(uuid) => markRead.mutate(uuid)}
            />
          ))}
        </div>
      ) : null}

      {hasNextPage ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            className="text-label-md rounded-xl border border-outline px-6 py-2.5 text-on-surface-variant disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
