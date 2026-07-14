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
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 rounded-full bg-surface-container-high/80 p-1">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                'flex-1 rounded-full px-4 py-2.5 text-sm font-bold capitalize transition-all sm:flex-none',
                filter === tab
                  ? 'bg-primary text-on-primary shadow-[0_6px_16px_-6px_rgba(13,99,27,0.5)]'
                  : 'text-on-surface-variant',
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
          className="self-start rounded-full px-3 py-2 text-sm font-bold text-primary disabled:opacity-45 sm:self-auto"
        >
          {markAll.isPending ? 'Updating…' : 'Mark all as read'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-[1.25rem] bg-surface-container" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
          {getApiErrorMessage(error, 'Could not load notifications')}
        </div>
      ) : null}

      {!isLoading && !error && notifications.length === 0 ? (
        <div className="rounded-[1.75rem] bg-surface px-6 py-14 text-center shadow-[0_4px_20px_-10px_rgba(15,40,20,0.14)]">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary-container/15 text-primary">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              notifications_off
            </span>
          </div>
          <p className="text-base font-bold text-on-surface">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Order updates and delivery alerts will appear here.
          </p>
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <div className="space-y-2.5">
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
        <div className="flex justify-center pt-1">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            className="rounded-full border border-outline-variant/50 bg-surface px-6 py-2.5 text-sm font-bold text-on-surface-variant disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
