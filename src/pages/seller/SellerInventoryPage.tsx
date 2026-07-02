import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/api/services'
import { Pagination } from '@/components/ui/Pagination'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const PAGE_SIZE = 15

export function SellerInventoryPage() {
  const queryClient = useQueryClient()
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [stockDraft, setStockDraft] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'inventory'],
    queryFn: () => sellerService.listInventory(),
  })

  const { data: lowStockData } = useQuery({
    queryKey: ['seller', 'inventory', 'low-stock'],
    queryFn: () => sellerService.listLowStock(),
  })

  const updateStock = useMutation({
    mutationFn: ({ uuid, stock }: { uuid: string; stock: number }) =>
      sellerService.updateInventory(uuid, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'inventory'] })
      queryClient.invalidateQueries({ queryKey: ['seller', 'inventory', 'low-stock'] })
      setEditingUuid(null)
    },
  })

  const items = data?.data ?? []
  const lowStock = lowStockData?.data ?? []

  const paginationMeta = useMemo(
    () => buildClientPaginationMeta(items.length, page, PAGE_SIZE),
    [items.length, page],
  )
  const pageItems = useMemo(
    () => paginateSlice(items, paginationMeta.current_page, PAGE_SIZE),
    [items, paginationMeta.current_page],
  )

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-headline-xl text-on-surface">Inventory</h1>
        <p className="text-body-md text-on-surface-variant">Track stock levels across your catalog</p>
      </div>

      {lowStock.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-body-lg mb-2 font-bold text-amber-900">Low stock alert</h2>
          <ul className="space-y-1 text-sm text-amber-900">
            {lowStock.map((item) => (
              <li key={item.uuid}>
                {item.name ?? item.uuid}: {item.stock ?? 0} left
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-error">{getApiErrorMessage(error, 'Failed to load inventory')}</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-on-surface">Product</th>
              <th className="px-4 py-3 text-on-surface">Stock</th>
              <th className="px-4 py-3 text-on-surface">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              : pageItems.map((item) => (
                  <tr key={item.uuid} className="border-t border-outline-variant/40">
                    <td className="px-4 py-3 font-medium text-on-surface">{item.name ?? item.uuid}</td>
                    <td className="px-4 py-3 text-on-surface">
                      {editingUuid === item.uuid ? (
                        <input
                          type="number"
                          min={0}
                          value={stockDraft}
                          onChange={(e) => setStockDraft(e.target.value)}
                          className="w-24 rounded border border-outline-variant px-2 py-1"
                        />
                      ) : (
                        item.stock ?? 0
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUuid === item.uuid ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-primary"
                            disabled={updateStock.isPending}
                            onClick={() =>
                              updateStock.mutate({ uuid: item.uuid, stock: Number(stockDraft) || 0 })
                            }
                          >
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingUuid(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-primary"
                          onClick={() => {
                            setEditingUuid(item.uuid)
                            setStockDraft(String(item.stock ?? 0))
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {items.length > 0 ? <Pagination meta={paginationMeta} onPageChange={setPage} /> : null}
    </div>
  )
}
