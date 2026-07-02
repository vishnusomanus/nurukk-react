import type { PaginationMeta } from '@/components/ui/Pagination'
import { cn } from '@/utils/cn'

function pageNumbers(current: number, last: number) {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, last, current, current - 1, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []

  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i]
    const prev = sorted[i - 1]
    if (prev !== undefined && page - prev > 1) {
      result.push('ellipsis')
    }
    result.push(page)
  }

  return result
}

export function CategoryListingPagination({
  meta,
  onPageChange,
  className,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  className?: string
}) {
  const current = Math.min(Math.max(1, meta.current_page), meta.last_page)
  const last = Math.max(1, meta.last_page)
  const pages = pageNumbers(current, last)

  if (last <= 1) return null

  return (
    <div className={cn('mt-8 flex items-center justify-center gap-4', className)}>
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
        className="rounded-lg border border-outline-variant p-2 transition-colors hover:bg-surface-container-high disabled:opacity-50"
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      <div className="flex gap-1">
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 w-10 items-center justify-center text-on-surface-variant"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'h-10 w-10 rounded-lg text-label-md transition-colors',
                page === current
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={current >= last}
        onClick={() => onPageChange(current + 1)}
        className="rounded-lg border border-outline-variant p-2 transition-colors hover:bg-surface-container-high disabled:opacity-50"
        aria-label="Next page"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  )
}
