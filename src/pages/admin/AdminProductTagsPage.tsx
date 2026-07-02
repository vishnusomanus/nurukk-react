import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import {
  createProductTag,
  deleteProductTag,
  listProductTags,
  updateProductTag,
  type AdminProductTag,
  type ProductTagPayload,
} from '@/api/services/adminProductTagsService'
import { buyerService } from '@/api/services'
import type { BuyerProduct } from '@/api/services/buyerService'
import { TagFormModal } from '@/components/admin/TagFormModal'
import { ConfirmActionModal } from '@/components/buyer/ConfirmActionModal'
import { Pagination } from '@/components/ui/Pagination'
import type { AdminOutletContext } from '@/layouts/AdminMarketplaceLayout'
import { countProductsByTag, getProductTagVisual } from '@/utils/adminCatalogMeta'
import { extractRows } from '@/utils/extractRows'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 6

export function AdminProductTagsPage() {
  const { search } = useOutletContext<AdminOutletContext>()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingTag, setEditingTag] = useState<AdminProductTag | null>(null)
  const [deletingTag, setDeletingTag] = useState<AdminProductTag | null>(null)

  useEffect(() => {
    setPage(1)
  }, [search])

  const tagsQuery = useQuery({
    queryKey: ['admin', 'product-tags'],
    queryFn: () => listProductTags(),
  })

  const productsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'products', 'tags-meta'],
    queryFn: () => buyerService.listProducts({ per_page: 200 }),
  })

  const tags = extractRows(tagsQuery.data?.data) as AdminProductTag[]
  const activeTags = tags.filter((tag) => tag.is_active !== false)
  const products = extractRows(productsQuery.data?.data) as BuyerProduct[]
  const usageCounts = useMemo(() => countProductsByTag(products), [products])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tags
    return tags.filter((tag) => `${tag.label} ${tag.value}`.toLowerCase().includes(query))
  }, [tags, search])

  const paginationMeta = useMemo(
    () => buildClientPaginationMeta(filtered.length, page, PAGE_SIZE),
    [filtered.length, page],
  )
  const pageRows = useMemo(
    () => paginateSlice(filtered, paginationMeta.current_page, PAGE_SIZE),
    [filtered, paginationMeta.current_page],
  )

  const mostUsed = useMemo(() => {
    if (activeTags.length === 0) return null
    return [...activeTags].sort(
      (a, b) => (usageCounts.get(b.value) ?? 0) - (usageCounts.get(a.value) ?? 0),
    )[0]
  }, [activeTags, usageCounts])

  const popularityBars = useMemo(() => {
    const max = Math.max(...activeTags.map((tag) => usageCounts.get(tag.value) ?? 0), 1)
    return activeTags.slice(0, 6).map((tag) => ({
      label: tag.label,
      height: `${Math.max(20, Math.round(((usageCounts.get(tag.value) ?? 0) / max) * 100))}%`,
    }))
  }, [activeTags, usageCounts])

  const saveTag = useMutation({
    mutationFn: async (payload: ProductTagPayload) => {
      if (modalMode === 'create') {
        return createProductTag(payload)
      }
      if (!editingTag) throw new Error('Missing tag')
      return updateProductTag(editingTag.uuid, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-tags'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'product-tags'] })
      setModalOpen(false)
      setEditingTag(null)
    },
  })

  const removeTag = useMutation({
    mutationFn: (uuid: string) => deleteProductTag(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-tags'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'product-tags'] })
      setDeletingTag(null)
    },
  })

  const openCreate = () => {
    setModalMode('create')
    setEditingTag(null)
    setModalOpen(true)
  }

  const openEdit = (tag: AdminProductTag) => {
    setModalMode('edit')
    setEditingTag(tag)
    setModalOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-headline-xl text-on-surface">Product Tags Management</h1>
          <p className="text-body-md mt-1 text-on-surface-variant">
            Create and manage global marketplace tags for vegetable filtering and product badges.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary shadow-md transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Create New Tag
        </button>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary-container/5 p-4">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-primary">info</span>
          <p className="text-body-md text-on-surface-variant">
            Tags appear in seller product forms and buyer filters. Inactive tags stay on existing products but
            cannot be assigned to new listings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="stitch-card-shadow rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label-md tracking-wider text-on-surface-variant uppercase">Total Active Tags</span>
            <span className="material-symbols-outlined text-primary">sell</span>
          </div>
          <div className="text-headline-xl text-on-surface">{activeTags.length}</div>
          <p className="mt-2 text-xs font-bold text-primary">{tags.length} tags in catalog</p>
        </div>

        <div className="stitch-card-shadow rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label-md tracking-wider text-on-surface-variant uppercase">Most Used</span>
            <span className="material-symbols-outlined text-secondary">eco</span>
          </div>
          <div className="text-headline-xl text-on-surface">{mostUsed?.label ?? '—'}</div>
          <p className="mt-2 text-xs text-on-surface-variant">
            {mostUsed ? `Used in ${usageCounts.get(mostUsed.value) ?? 0} products` : 'No tag data yet'}
          </p>
        </div>

        <div className="stitch-card-shadow relative overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 lg:col-span-6">
          <h3 className="text-headline-lg mb-4 text-on-surface">Tag Popularity Distribution</h3>
          <div className="flex h-20 items-end gap-3 px-2">
            {popularityBars.map((bar) => (
              <div key={bar.label} className="group flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary/20 transition-colors group-hover:bg-primary"
                  style={{ height: bar.height }}
                  title={bar.label}
                />
                <span className="text-[10px] text-on-surface-variant">{bar.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stitch-card-shadow overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest lg:col-span-12">
          <div className="flex flex-col gap-3 border-b border-outline-variant/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-headline-lg text-on-surface">Marketplace Tags</h3>
            <Link
              to="/admin/catalog"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              View catalog
            </Link>
          </div>

          {tagsQuery.error ? (
            <p className="px-6 py-8 text-body-md text-error">
              {getApiErrorMessage(tagsQuery.error, 'Failed to load product tags')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container/50">
                    <th className="text-label-md px-6 py-4 tracking-wider text-on-surface-variant uppercase">Tag Name</th>
                    <th className="text-label-md px-6 py-4 tracking-wider text-on-surface-variant uppercase">
                      Visual Preview
                    </th>
                    <th className="text-label-md px-6 py-4 tracking-wider text-on-surface-variant uppercase">
                      Usage Count
                    </th>
                    <th className="text-label-md px-6 py-4 tracking-wider text-on-surface-variant uppercase">Status</th>
                    <th className="text-label-md px-6 py-4 text-right tracking-wider text-on-surface-variant uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {tagsQuery.isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-body-md text-on-surface-variant">
                        Loading tags…
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-body-md text-on-surface-variant">
                        No tags match your search.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((tag, index) => {
                      const visual = getProductTagVisual(tag.value, index)
                      const usage = usageCounts.get(tag.value) ?? 0
                      const isActive = tag.is_active !== false
                      return (
                        <tr key={tag.uuid} className="group transition-colors hover:bg-surface-variant/20">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className={cn('flex h-8 w-8 items-center justify-center rounded', visual.iconWrapClass)}>
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  {visual.icon}
                                </span>
                              </div>
                              <div>
                                <span className="font-bold text-on-surface">{tag.label}</span>
                                <p className="text-[11px] text-on-surface-variant">{tag.value}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn('rounded-full px-3 py-1 text-[12px] font-bold', visual.chipClass)}>
                              {tag.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-price-display text-on-surface">{usage} products</td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="flex items-center gap-1 text-[12px] font-bold text-primary">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[12px] font-bold text-on-surface-variant">
                                <span className="h-2 w-2 rounded-full bg-outline-variant" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => openEdit(tag)}
                                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"
                                title="Edit tag"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTag(tag)}
                                className="rounded-lg p-2 text-error hover:bg-error-container/20"
                                title="Delete tag"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
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
          )}

          <div className="border-t border-outline-variant/30 px-6 py-4">
            {filtered.length > 0 ? (
              <Pagination meta={paginationMeta} onPageChange={setPage} />
            ) : null}
          </div>
        </div>

        <div className="stitch-card-shadow rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 lg:col-span-4">
          <h3 className="text-headline-lg mb-4 text-on-surface">Live Marketplace Tag Cloud</h3>
          <div className="flex flex-wrap gap-2">
            {activeTags.map((tag, index) => {
              const visual = getProductTagVisual(tag.value, index)
              return (
                <span
                  key={tag.uuid}
                  className={cn(
                    'cursor-default rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-transform hover:scale-105',
                    visual.chipClass,
                  )}
                >
                  {tag.label}
                </span>
              )
            })}
          </div>
          <div className="mt-6 border-t border-outline-variant/30 pt-6">
            <p className="text-label-md mb-3 text-on-surface-variant">Quick editor tip</p>
            <p className="text-body-md text-on-surface-variant">
              Tags with higher usage counts appear more often in buyer filters and product cards. Review tagged
              products in catalog moderation to keep labeling accurate.
            </p>
          </div>
        </div>

        <div className="stitch-card-shadow rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-lg text-on-surface">Usage Overview</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-xs text-on-surface-variant">Product count</span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {tags.map((tag) => (
              <div
                key={tag.uuid}
                className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3"
              >
                <span className="text-body-md font-medium text-on-surface">{tag.label}</span>
                <span className="text-label-md font-bold text-primary">{usageCounts.get(tag.value) ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TagFormModal
        open={modalOpen}
        mode={modalMode}
        tag={editingTag}
        saving={saveTag.isPending}
        onClose={() => {
          if (saveTag.isPending) return
          setModalOpen(false)
          setEditingTag(null)
        }}
        onSubmit={(payload) => saveTag.mutate(payload)}
      />

      <ConfirmActionModal
        open={Boolean(deletingTag)}
        title="Delete tag?"
        message={`Delete "${deletingTag?.label}"?`}
        description={
          deletingTag && (usageCounts.get(deletingTag.value) ?? 0) > 0
            ? `This tag is used on ${usageCounts.get(deletingTag.value)} products. Removing it from the catalog stops new assignments; existing product labels remain until edited.`
            : 'Remove this tag from the marketplace catalog?'
        }
        confirmLabel="Delete tag"
        confirming={removeTag.isPending}
        onClose={() => {
          if (removeTag.isPending) return
          setDeletingTag(null)
        }}
        onConfirm={() => {
          if (!deletingTag) return
          removeTag.mutate(deletingTag.uuid)
        }}
      />
    </div>
  )
}
