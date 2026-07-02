import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  loading,
  skeletonRows = 6,
  onRowClick,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: React.ReactNode
  loading?: boolean
  skeletonRows?: number
  onRowClick?: (row: T) => void
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'text-label-md px-4 py-3 text-left font-bold tracking-wider text-on-surface-variant uppercase',
                      c.className,
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-t border-outline-variant/30">
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3', c.className)}>
                      <Skeleton className="h-4 w-full max-w-[240px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 text-body-md text-on-surface-variant">
        {empty ?? 'No results.'}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-container-low">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'text-label-md px-4 py-3 text-left font-bold tracking-wider text-on-surface-variant uppercase',
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={rowKey(r)}
                className={cn(
                  'border-t border-outline-variant/30',
                  onRowClick && 'cursor-pointer hover:bg-surface-container-low/80',
                )}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn('text-body-md px-4 py-3 align-top text-on-surface', c.className)}
                  >
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
