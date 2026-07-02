import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { listSellers, type AdminSeller } from '@/api/services/adminSellersService'
import { extractRows } from '@/utils/extractRows'
import { extractPaginationMeta } from '@/utils/extractPaginationMeta'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

export function SellersPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'sellers', page],
    queryFn: () => listSellers({ page, per_page: 15 }),
  })

  const rows = extractRows(data?.data) as AdminSeller[]
  const meta = extractPaginationMeta(data)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sellers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-sm text-amber-700 dark:text-amber-200">
              {getApiErrorMessage(error, 'Failed to load sellers')}
            </div>
          ) : null}

          <DataTable
            loading={isLoading}
            columns={[
              { key: 'name', header: 'Name', cell: (r) => r.name },
              { key: 'email', header: 'Email', cell: (r) => r.email },
              { key: 'status', header: 'Status', cell: (r) => r.status },
            ]}
            rows={rows}
            rowKey={(r) => r.uuid}
            empty="No sellers found."
          />

          {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
