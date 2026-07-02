import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { listOrders, type AdminOrder } from '@/api/services/adminOrdersService'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

export function OrdersPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'orders', page],
    queryFn: () => listOrders({ page, per_page: 15 }),
  })

  const rows = extractRows(data?.data) as AdminOrder[]
  const meta = extractPaginationMeta(data)

  return (
    <div className="space-y-4 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-body-md text-error">
              {getApiErrorMessage(error, 'Failed to load orders')}
            </div>
          ) : null}

          <DataTable
            loading={isLoading}
            columns={[
              { key: 'order', header: 'Order', cell: (r) => r.order_number ?? r.uuid.slice(0, 8) },
              { key: 'status', header: 'Status', cell: (r) => r.status.replace(/_/g, ' ') },
              {
                key: 'payment',
                header: 'Payment',
                cell: (r) => `${r.payment_method ?? '—'} · ${r.payment_status ?? '—'}`,
              },
              { key: 'total', header: 'Total', cell: (r) => (r.total != null ? String(r.total) : '—') },
              {
                key: 'placed',
                header: 'Placed',
                cell: (r) =>
                  typeof r.created_at === 'string' ? new Date(r.created_at).toLocaleDateString('en-IN') : '—',
              },
              {
                key: 'actions',
                header: '',
                cell: (r) => (
                  <Link to={`/admin/orders/${r.uuid}`} className="font-semibold text-primary hover:underline">
                    View details
                  </Link>
                ),
              },
            ]}
            rows={rows}
            rowKey={(r) => r.uuid}
            empty="No orders found."
          />

          {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
