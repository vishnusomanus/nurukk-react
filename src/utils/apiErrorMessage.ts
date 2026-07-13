function firstValidationMessage(v: unknown): string | null {
  if (typeof v === 'string') {
    const t = v.trim()
    return t || null
  }
  if (Array.isArray(v)) {
    for (const item of v) {
      const m = firstValidationMessage(item)
      if (m) return m
    }
    return null
  }
  if (typeof v === 'object' && v !== null) {
    for (const item of Object.values(v as Record<string, unknown>)) {
      const m = firstValidationMessage(item)
      if (m) return m
    }
  }
  return null
}

/** Laravel-style `errors` object: first message per field key. */
export function getApiFieldErrorMap(err: unknown): Record<string, string> {
  const payload = readApiPayload(err)
  const raw = payload?.errors
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const msg = firstValidationMessage(v)
    if (msg) out[k] = msg
  }
  return out
}

function flattenServerErrors(errors: unknown): string[] {
  if (errors == null) return []
  if (typeof errors === 'string') {
    const t = errors.trim()
    return t ? [t] : []
  }
  if (Array.isArray(errors)) {
    return errors.flatMap((item) => flattenServerErrors(item))
  }
  if (typeof errors === 'object') {
    const out: string[] = []
    for (const v of Object.values(errors as Record<string, unknown>)) {
      out.push(...flattenServerErrors(v))
    }
    return out
  }
  return []
}

function readApiPayload(err: unknown): Record<string, unknown> | null {
  if (typeof err !== 'object' || err === null) return null
  const anyErr = err as { response?: { data?: unknown } }
  const data = anyErr.response?.data
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null
}

function normalizeErrorText(s: string): string {
  return s.trim().replace(/[.!?]+$/g, '').toLowerCase()
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const payload = readApiPayload(err)
  if (!payload) return fallback

  const parts: string[] = []
  const seen = new Set<string>()
  const pushUnique = (s: string) => {
    const t = s.trim()
    if (!t) return
    const key = normalizeErrorText(t)
    if (!key || seen.has(key)) return
    seen.add(key)
    parts.push(t)
  }

  const msg = payload.message
  if (typeof msg === 'string') pushUnique(msg)

  const errField = payload.error
  if (typeof errField === 'string') pushUnique(errField)

  for (const line of flattenServerErrors(payload.errors)) {
    pushUnique(line)
  }

  return parts.length ? parts.join('\n') : fallback
}

/** True when the API indicates no seller/delivery profile row yet (needs onboarding). */
export function isProfileNotFoundError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const status = (err as { response?: { status?: number } }).response?.status
  if (status === 404) return true
  const text = normalizeErrorText(getApiErrorMessage(err, ''))
  return text.includes('profile not found')
}

/** Only the top-level API `message` string (no field errors). */
export function getApiMessage(err: unknown, fallback: string): string {
  const payload = readApiPayload(err)
  const msg = payload?.message
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  return fallback
}
