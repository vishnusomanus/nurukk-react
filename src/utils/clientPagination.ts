import type { PaginationMeta } from '@/components/ui/Pagination'

export function buildClientPaginationMeta(total: number, page: number, perPage: number): PaginationMeta {
  const last_page = Math.max(1, Math.ceil(Math.max(0, total) / perPage) || 1)
  const current_page = Math.min(Math.max(1, page), last_page)

  return {
    current_page,
    per_page: perPage,
    total: Math.max(0, total),
    last_page,
  }
}

export function paginateSlice<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}
