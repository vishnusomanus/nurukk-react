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
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          unread ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant',
        )}
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className={cn('text-body-md text-on-surface', unread && 'font-semibold')}>
            {notification.title ?? 'Update'}
          </p>
          {notification.created_at ? (
            <span className="text-label-md flex-shrink-0 text-on-surface-variant">
              {formatNotificationTime(notification.created_at)}
            </span>
          ) : null}
        </div>
        {notification.body ? (
          <p className={cn('text-body-sm text-on-surface-variant', compact ? 'line-clamp-2' : 'mt-1')}>
            {notification.body}
          </p>
        ) : null}
      </div>
      {unread ? <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-hidden /> : null}
    </>
  )

  const className = cn(
    'flex w-full items-start gap-3 border-b border-outline-variant/40 text-left transition-colors last:border-0',
    compact ? 'px-4 py-3 hover:bg-surface-container-low' : 'rounded-xl border border-outline-variant bg-surface p-4 hover:bg-surface-container-lowest',
    unread && compact && 'bg-primary-container/10',
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
