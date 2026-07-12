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

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const payload = readApiPayload(err)
  if (!payload) return fallback

  const parts: string[] = []
  const pushUnique = (s: string) => {
    const t = s.trim()
    if (!t || parts.includes(t)) return
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

/** Only the top-level API `message` string (no field errors). */
export function getApiMessage(err: unknown, fallback: string): string {
  const payload = readApiPayload(err)
  const msg = payload?.message
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  return fallback
}
