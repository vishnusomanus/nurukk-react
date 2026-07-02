import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type AdminCategory,
  type CategoryPayload,
} from '@/api/services/adminCategoriesService'
import { buyerService } from '@/api/services'
import type { BuyerProduct } from '@/api/services/buyerService'
import { CategoryFormModal } from '@/components/admin/CategoryFormModal'
import { ConfirmActionModal } from '@/components/buyer/ConfirmActionModal'
import { Pagination } from '@/components/ui/Pagination'
import type { AdminOutletContext } from '@/layouts/AdminMarketplaceLayout'
import {
  countProductsByCategory,
  getCategoryIcon,
  getCategoryTone,
} from '@/utils/adminCatalogMeta'
import { extractRows } from '@/utils/extractRows'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 8

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  icon: string
  tone?: 'default' | 'primary'
}) {
  return (
    <div
      className={cn(
        'stitch-card-shadow relative overflow-hidden rounded-xl border p-6',
        tone === 'primary'
          ? 'border-primary/20 bg-primary text-on-primary'
          : 'border-outline-variant/40 bg-surface-container-lowest',
      )}
    >
      {tone !== 'primary' ? (
        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-5">
          {icon}
        </span>
      ) : null}
      <p
        className={cn(
          'text-label-md mb-1 tracking-wide uppercase',
          tone === 'primary' ? 'text-on-primary-container/90' : 'text-on-surface-variant',
        )}
      >
        {label}
      </p>
      <h3 className={cn('text-headline-xl', tone === 'primary' ? 'text-white' : 'text-primary')}>{value}</h3>
      {hint ? (
        <p className={cn('mt-1 text-[11px] font-bold', tone === 'primary' ? 'text-white/80' : 'text-on-surface-variant')}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function AdminCategoriesPage() {
  const { search } = useOutletContext<AdminOutletContext>()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null)

  useEffect(() => {
    setPage(1)
  }, [search])

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => listCategories(),
  })

  const productsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'products', 'categories-meta'],
    queryFn: () => buyerService.listProducts({ per_page: 200 }),
  })

  const categories = extractRows(categoriesQuery.data?.data) as AdminCategory[]
  const products = extractRows(productsQuery.data?.data) as BuyerProduct[]
  const productCounts = useMemo(() => countProductsByCategory(products), [products])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => {
      const haystack = `${category.name ?? ''} ${category.slug ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [categories, search])

  const paginationMeta = useMemo(
    () => buildClientPaginationMeta(filtered.length, page, PAGE_SIZE),
    [filtered.length, page],
  )
  const pageRows = useMemo(
    () => paginateSlice(filtered, paginationMeta.current_page, PAGE_SIZE),
    [filtered, paginationMeta.current_page],
  )

  const topCategory = useMemo(() => {
    if (categories.length === 0) return null
    return [...categories].sort(
      (a, b) => (productCounts.get(b.uuid) ?? 0) - (productCounts.get(a.uuid) ?? 0),
    )[0]
  }, [categories, productCounts])

  const saveCategory = useMutation({
    mutationFn: async (payload: CategoryPayload) => {
      if (modalMode === 'create') {
        return createCategory(payload)
      }
      if (!editingCategory) throw new Error('Missing category')
      return updateCategory(editingCategory.uuid, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'categories'] })
      setModalOpen(false)
      setEditingCategory(null)
    },
  })

  const removeCategory = useMutation({
    mutationFn: (uuid: string) => deleteCategory(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'categories'] })
      setDeletingCategory(null)
    },
  })

  const openCreate = () => {
    setModalMode('create')
    setEditingCategory(null)
    setModalOpen(true)
  }

  const openEdit = (category: AdminCategory) => {
    setModalMode('edit')
    setEditingCategory(category)
    setModalOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-headline-xl text-on-surface">Categories Management</h1>
          <p className="text-body-md text-on-surface-variant">
            Configure and organize your farm-fresh vegetable classifications.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary shadow-md transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Categories" value={categories.length} hint="Live marketplace taxonomy" icon="eco" />
        <StatCard label="Total Products" value={products.length} hint="Across all categories" icon="inventory" />
        <StatCard
          label="Top Performer"
          value={topCategory?.name ?? '—'}
          hint={
            topCategory
              ? `${productCounts.get(topCategory.uuid) ?? 0} products listed`
              : 'No categories yet'
          }
          icon="trending_up"
        />
        <StatCard label="System Health" value="Optimal" hint="All nodes online" icon="verified" tone="primary" />
      </div>

      {categoriesQuery.error ? (
        <p className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-body-md text-error">
          {getApiErrorMessage(categoriesQuery.error, 'Failed to load categories')}
        </p>
      ) : null}

      <div className="stitch-card-shadow overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                <th className="text-label-md px-6 py-4 text-on-surface-variant">Icon & Category Name</th>
                <th className="text-label-md px-6 py-4 text-center text-on-surface-variant">Products</th>
                <th className="text-label-md px-6 py-4 text-on-surface-variant">Status</th>
                <th className="text-label-md px-6 py-4 text-on-surface-variant">Buyer Menu</th>
                <th className="text-label-md px-6 py-4 text-right text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {categoriesQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-body-md text-on-surface-variant">
                    Loading categories…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-body-md text-on-surface-variant">
                    No categories match your search.
                  </td>
                </tr>
              ) : (
                pageRows.map((category, index) => {
                  const tone = getCategoryTone(index)
                  const active = category.is_active !== false
                  return (
                    <tr key={category.uuid} className="group transition-colors hover:bg-surface-container/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                              tone.bg,
                              tone.text,
                            )}
                          >
                            <span className="material-symbols-outlined text-[28px]">{getCategoryIcon(category)}</span>
                          </div>
                          <div>
                            <p className="text-body-lg font-bold text-on-surface">{category.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{category.slug ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-price-display text-primary">{productCounts.get(category.uuid) ?? 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold',
                            active ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant',
                          )}
                        >
                          <span
                            className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-primary animate-pulse' : 'bg-on-surface-variant')}
                          />
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-body-md text-on-surface-variant">
                          {category.show_in_menu ? `Shown · order ${category.menu_sort_order ?? 0}` : 'Hidden'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            className="rounded-lg p-2 text-on-surface-variant hover:text-primary"
                            aria-label={`Edit ${category.name}`}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(category)}
                            className="rounded-lg p-2 text-on-surface-variant hover:text-error"
                            aria-label={`Delete ${category.name}`}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-outline-variant/10 px-6 py-4">
          {filtered.length > 0 ? (
            <Pagination meta={paginationMeta} onPageChange={setPage} />
          ) : null}
        </div>
      </div>

      <CategoryFormModal
        open={modalOpen}
        mode={modalMode}
        category={editingCategory}
        saving={saveCategory.isPending}
        onClose={() => {
          if (saveCategory.isPending) return
          setModalOpen(false)
          setEditingCategory(null)
        }}
        onSubmit={(payload) => saveCategory.mutate(payload)}
      />

      <ConfirmActionModal
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => deletingCategory && removeCategory.mutate(deletingCategory.uuid)}
        title="Delete Category"
        message={`Delete "${deletingCategory?.name}"?`}
        description="Products in this category may need to be reassigned before removal."
        confirmLabel="Delete category"
        confirming={removeCategory.isPending}
      />

      {saveCategory.error ? (
        <p className="text-body-md text-error">{getApiErrorMessage(saveCategory.error, 'Failed to save category')}</p>
      ) : null}
      {removeCategory.error ? (
        <p className="text-body-md text-error">{getApiErrorMessage(removeCategory.error, 'Failed to delete category')}</p>
      ) : null}
    </div>
  )
}
