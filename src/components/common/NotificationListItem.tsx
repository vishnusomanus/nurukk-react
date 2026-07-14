import { Link } from 'react-router-dom'
import type { AppNotification } from '@/api/services/notificationsService'
import {
  formatNotificationTime,
  getNotificationHref,
  notificationIcon,
} from '@/utils/notificationNavigation'
import { cn } from '@/utils/cn'

type NotificationListItemProps = {
  notification: AppNotification
  role?: string | null
  onMarkRead?: (uuid: string) => void
  onNavigate?: () => void
  compact?: boolean
}

export function NotificationListItem({
  notification,
  role,
  onMarkRead,
  onNavigate,
  compact = false,
}: NotificationListItemProps) {
  const href = getNotificationHref(notification, role)
  const unread = !notification.is_read
  const icon = notificationIcon(notification.type)

  const content = (
    <>
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-2xl',
          unread
            ? 'bg-primary text-on-primary shadow-[0_8px_16px_-8px_rgba(13,99,27,0.55)]'
            : 'bg-surface-container-high text-on-surface-variant',
        )}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={unread ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug text-on-surface', unread && 'font-bold')}>
            {notification.title ?? 'Update'}
          </p>
          {notification.created_at ? (
            <span className="shrink-0 text-[11px] font-medium text-on-surface-variant">
              {formatNotificationTime(notification.created_at)}
            </span>
          ) : null}
        </div>
        {notification.body ? (
          <p
            className={cn(
              'mt-0.5 text-xs leading-relaxed text-on-surface-variant',
              compact ? 'line-clamp-2' : 'line-clamp-3',
            )}
          >
            {notification.body}
          </p>
        ) : null}
      </div>
      {unread ? (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-secondary-container" aria-hidden />
      ) : null}
    </>
  )

  const className = cn(
    'flex w-full items-start gap-3 text-left transition-all active:scale-[0.99]',
    compact
      ? 'rounded-2xl px-3 py-3 hover:bg-surface-container-low'
      : 'rounded-[1.25rem] bg-surface px-4 py-3.5 shadow-[0_4px_16px_-10px_rgba(15,40,20,0.18)]',
    unread && compact && 'bg-primary-container/12',
    unread && !compact && 'ring-1 ring-primary/15',
  )

  const handleActivate = () => {
    if (unread && onMarkRead) onMarkRead(notification.uuid)
    onNavigate?.()
  }

  if (href) {
    return (
      <Link to={href} onClick={handleActivate} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={handleActivate} className={className}>
      {content}
    </button>
  )
}
