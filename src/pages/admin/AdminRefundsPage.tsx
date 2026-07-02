import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminRefundsService } from '@/api/services'
import { Pagination } from '@/components/ui/Pagination'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

export function AdminRefundsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'refunds', page],
    queryFn: () => adminRefundsService.listRefunds({ page, per_page: 15 }),
  })

  const rows = extractRows(data?.data)
  const meta = extractPaginationMeta(data)

  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="text-headline-xl text-on-surface">Refunds</h1>
      {error ? <p className="text-sm text-error">{getApiErrorMessage(error, 'Failed to load')}</p> : null}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-on-surface">Order</th>
              <th className="px-4 py-3 text-on-surface">Amount</th>
              <th className="px-4 py-3 text-on-surface">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant">
                  No refunds yet
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={String(row.uuid ?? index)} className="border-t border-outline-variant/40">
                  <td className="px-4 py-3 text-on-surface">{String(row.order_uuid ?? '—')}</td>
                  <td className="px-4 py-3 text-on-surface">{row.amount != null ? String(row.amount) : '—'}</td>
                  <td className="px-4 py-3 text-on-surface">{String(row.status ?? '—')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
    </div>
  )
}
