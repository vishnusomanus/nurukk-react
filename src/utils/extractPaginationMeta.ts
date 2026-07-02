import type { PaginationMeta } from '@/components/ui/Pagination'

type UnknownRecord = Record<string, unknown>

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function toInt(v: unknown, fallback: number) {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.floor(n)
}

function resolveMeta(payload: unknown): UnknownRecord | null {
  if (!isRecord(payload)) return null

  const direct = payload['meta']
  if (isRecord(direct)) return direct

  const data = payload['data']
  if (isRecord(data)) {
    const nested = data['meta']
    if (isRecord(nested)) return nested
  }

  return null
}

export function extractPaginationMeta(payload: unknown): PaginationMeta | null {
  const meta = resolveMeta(payload)
  if (!meta) return null

  const current_page = toInt(meta['current_page'], 1)
  const per_page = toInt(meta['per_page'], 15)
  const total = toInt(meta['total'], 0)
  const last_page = toInt(meta['last_page'], Math.max(1, Math.ceil(total / Math.max(1, per_page))))

  return {
    current_page: Math.max(1, current_page),
    per_page: Math.max(1, per_page),
    total: Math.max(0, total),
    last_page: Math.max(1, last_page),
  }
}
