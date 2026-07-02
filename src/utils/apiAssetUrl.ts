import { API_BASE_URL } from '@/constants/env'

/** Turn API-relative storage paths into absolute URLs for img src and product payloads. */
export function resolveApiAssetUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^(https?:|data:)/i.test(trimmed)) return trimmed
  const base = API_BASE_URL.replace(/\/$/, '')
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`
}
