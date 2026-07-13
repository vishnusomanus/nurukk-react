import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/api/services'
import type { InventoryItem } from '@/api/services/sellerService'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { Pagination } from '@/components/ui/Pagination'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 15

const softCard =
  'rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none'

type StockFilter = 'all' | 'low'

function isLowStock(item: InventoryItem, lowUuids: Set<string>): boolean {
  if (lowUuids.has(item.uuid)) return true
  const threshold = item.low_stock_threshold
  if (typeof threshold === 'number') return (item.stock ?? 0) <= threshold
  return (item.stock ?? 0) <= 5
}

export function SellerInventoryPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [stockDraft, setStockDraft] = useState('')
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<StockFilter>('all')

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
  const lowUuids = useMemo(() => new Set(lowStock.map((item) => item.uuid)), [lowStock])

  const filteredItems = useMemo(() => {
    if (filter === 'low') return items.filter((item) => isLowStock(item, lowUuids))
    return items
  }, [filter, items, lowUuids])

  const paginationMeta = useMemo(
    () => buildClientPaginationMeta(filteredItems.length, page, PAGE_SIZE),
    [filteredItems.length, page],
  )
  const pageItems = useMemo(
    () => paginateSlice(filteredItems, paginationMeta.current_page, PAGE_SIZE),
    [filteredItems, paginationMeta.current_page],
  )

  const startEdit = (item: InventoryItem) => {
    setEditingUuid(item.uuid)
    setStockDraft(String(item.stock ?? 0))
  }

  const cancelEdit = () => {
    setEditingUuid(null)
    setStockDraft('')
  }

  return (
    <SellerPageShell pathname={location.pathname} className="space-y-3 lg:space-y-5">
      <div className="hidden lg:block">
        <h1 className="text-headline-xl text-primary">Inventory</h1>
        <p className="text-body-md text-on-surface-variant">Track stock levels across your catalog</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={cn(softCard, 'px-3 py-3')}>
          <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">SKUs</p>
          <p className="mt-0.5 text-xl font-bold text-on-surface">{items.length}</p>
        </div>
        <div className={cn(softCard, 'px-3 py-3')}>
          <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Low stock</p>
          <p className={cn('mt-0.5 text-xl font-bold', lowStock.length > 0 ? 'text-secondary' : 'text-on-surface')}>
            {lowStock.length}
          </p>
        </div>
      </div>

      <div className="flex gap-1 rounded-full bg-surface-container-lowest p-1 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:max-w-sm lg:rounded-xl">
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'low' as const, label: `Low stock${lowStock.length ? ` (${lowStock.length})` : ''}` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setFilter(tab.id)
              setPage(1)
              cancelEdit()
            }}
            className={cn(
              'flex-1 rounded-full px-3 py-2.5 text-xs font-bold transition-colors sm:text-sm lg:rounded-lg',
              filter === tab.id
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant active:bg-surface-container-low',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
          {getApiErrorMessage(error, 'Failed to load inventory')}
        </p>
      ) : null}

      {updateStock.isError ? (
        <p className="rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-sm text-error">
          {getApiErrorMessage(updateStock.error, 'Failed to update stock')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className={cn(softCard, 'py-14 text-center')}>
          <span className="material-symbols-outlined mb-3 text-5xl text-outline">warehouse</span>
          <p className="text-sm text-on-surface-variant">
            {filter === 'low' ? 'No low-stock items right now.' : 'No inventory items yet.'}
          </p>
          {filter === 'all' ? (
            <Link to="/seller/products/new" className="mt-4 inline-block text-sm font-bold text-primary">
              Add a product
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((item) => {
            const low = isLowStock(item, lowUuids)
            const editing = editingUuid === item.uuid

            return (
              <article key={item.uuid} className={cn(softCard, 'overflow-hidden')}>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      low ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary',
                    )}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {low ? 'warning' : 'inventory_2'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold text-on-surface">
                        {item.name ?? item.uuid}
                      </h3>
                      {low ? (
                        <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-secondary uppercase">
                          Low
                        </span>
                      ) : null}
                    </div>
                    {!editing ? (
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        <span className="font-bold text-on-surface">{item.stock ?? 0}</span> in stock
                        {typeof item.low_stock_threshold === 'number'
                          ? ` · alert at ${item.low_stock_threshold}`
                          : ''}
                      </p>
                    ) : null}
                  </div>

                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="flex h-10 shrink-0 items-center gap-1 rounded-xl bg-surface-container-low px-3 text-sm font-bold text-primary active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Edit
                    </button>
                  ) : null}
                </div>

                {editing ? (
                  <div className="flex items-center gap-2 border-t border-outline-variant/30 bg-surface-container-low/40 px-3.5 py-3">
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Stock quantity</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={stockDraft}
                        onChange={(e) => setStockDraft(e.target.value)}
                        autoFocus
                        className="w-full rounded-xl border-none bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-on-surface outline-none ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={updateStock.isPending}
                      onClick={() =>
                        updateStock.mutate({ uuid: item.uuid, stock: Number(stockDraft) || 0 })
                      }
                      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:opacity-50 active:scale-[0.98]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={updateStock.isPending}
                      onClick={cancelEdit}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface-variant active:bg-surface-container"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}

      {filteredItems.length > 0 ? <Pagination meta={paginationMeta} onPageChange={setPage} /> : null}
    </SellerPageShell>
  )
}
