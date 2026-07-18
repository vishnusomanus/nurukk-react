/** Delivery agent service radius limits (matches API rules). */
export const SERVICE_RADIUS_MIN_KM = 1
export const SERVICE_RADIUS_MAX_KM = 100
export const SERVICE_RADIUS_DEFAULT_KM = 10

export function parseServiceRadiusKm(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return n
}

/** Returns a short, user-facing error — or null when valid. */
export function validateServiceRadiusKm(value: string): string | null {
  const n = parseServiceRadiusKm(value)
  if (n == null) {
    return 'Enter a service radius in kilometres.'
  }
  if (n < SERVICE_RADIUS_MIN_KM) {
    return `Service radius must be at least ${SERVICE_RADIUS_MIN_KM} km.`
  }
  if (n > SERVICE_RADIUS_MAX_KM) {
    return `Service radius can’t be more than ${SERVICE_RADIUS_MAX_KM} km.`
  }
  // Allow whole or half kilometres only (matches input step).
  if (Math.round(n * 2) / 2 !== n) {
    return 'Use whole or half kilometres (e.g. 5, 7.5, or 10).'
  }
  return null
}

export const SERVICE_RADIUS_HINT = `How far you’ll travel for pickups (${SERVICE_RADIUS_MIN_KM}–${SERVICE_RADIUS_MAX_KM} km).`
