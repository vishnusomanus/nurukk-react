import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export type PaginationMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export function Pagination({
  meta,
  onPageChange,
  className,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  className?: string
}) {
  const current = clampInt(meta.current_page, 1, meta.last_page || 1)
  const last = Math.max(1, Math.floor(meta.last_page || 1))
  const total = Math.max(0, Math.floor(meta.total || 0))
  const from = total === 0 ? 0 : (current - 1) * meta.per_page + 1
  const to = total === 0 ? 0 : Math.min(total, current * meta.per_page)

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="text-label-md text-on-surface-variant">
        {total === 0 ? (
          <>0 results</>
        ) : (
          <>
            Showing <span className="font-semibold text-on-surface">{from}</span>–
            <span className="font-semibold text-on-surface">{to}</span> of{' '}
            <span className="font-semibold text-on-surface">{total}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <div className="text-label-md text-on-surface-variant">
          Page <span className="font-semibold text-on-surface">{current}</span> of{' '}
          <span className="font-semibold text-on-surface">{last}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={current <= 1}
            onClick={() => onPageChange(Math.max(1, current - 1))}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={current >= last}
            onClick={() => onPageChange(Math.min(last, current + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.floor(n)))
}
