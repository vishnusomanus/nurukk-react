import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import {
  listCategories,
  updateCategory,
  type AdminCategory,
} from '@/api/services/adminCategoriesService'
import { buildClientPaginationMeta, paginateSlice } from '@/utils/clientPagination'
import { extractRows } from '@/utils/extractRows'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const PAGE_SIZE = 15

function MenuToggle({
  category,
  disabled,
  onToggle,
}: {
  category: AdminCategory
  disabled: boolean
  onToggle: (next: boolean) => void
}) {
  const checked = category.show_in_menu === true

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-white/80">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || category.is_active === false}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
      />
      <span>{checked ? 'Shown' : 'Hidden'}</span>
    </label>
  )
}

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => listCategories(),
  })

  const toggleMenu = useMutation({
    mutationFn: ({ uuid, show_in_menu }: { uuid: string; show_in_menu: boolean }) =>
      updateCategory(uuid, { show_in_menu }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['buyer', 'categories', 'menu'] })
    },
  })

  const rows = extractRows(data?.data) as AdminCategory[]

  const paginationMeta = useMemo(
    () => buildClientPaginationMeta(rows.length, page, PAGE_SIZE),
    [rows.length, page],
  )
  const pageRows = useMemo(
    () => paginateSlice(rows, paginationMeta.current_page, PAGE_SIZE),
    [rows, paginationMeta.current_page],
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-white/70">
            Toggle <strong>Show in menu</strong> to control which categories appear in the buyer
            desktop navigation next to Shop All.
          </p>

          {error ? (
            <div className="text-sm text-amber-700 dark:text-amber-200">
              {getApiErrorMessage(error, 'Failed to load categories')}
            </div>
          ) : null}

          {toggleMenu.error ? (
            <div className="text-sm text-amber-700 dark:text-amber-200">
              {getApiErrorMessage(toggleMenu.error, 'Failed to update category menu visibility')}
            </div>
          ) : null}

          <DataTable
            loading={isLoading}
            columns={[
              { key: 'name', header: 'Name', cell: (r) => r.name },
              { key: 'slug', header: 'Slug', cell: (r) => r.slug ?? '—' },
              {
                key: 'active',
                header: 'Active',
                cell: (r) => (r.is_active === false ? 'No' : 'Yes'),
              },
              {
                key: 'menu',
                header: 'Buyer menu',
                cell: (r) => (
                  <MenuToggle
                    category={r}
                    disabled={toggleMenu.isPending}
                    onToggle={(show_in_menu) =>
                      toggleMenu.mutate({ uuid: r.uuid, show_in_menu })
                    }
                  />
                ),
              },
              {
                key: 'order',
                header: 'Menu order',
                cell: (r) => r.menu_sort_order ?? 0,
              },
            ]}
            rows={pageRows}
            rowKey={(r) => r.uuid}
            empty="No categories found."
          />

          {rows.length > 0 ? <Pagination meta={paginationMeta} onPageChange={setPage} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
