export type CartStoreSummary = {
  uuid: string
  store_name?: string | null
}

export type CartStoreConflict = {
  message: string
  currentStore: CartStoreSummary
  incomingStore: CartStoreSummary
}

function readApiPayload(err: unknown): Record<string, unknown> | null {
  if (typeof err !== 'object' || err === null) return null
  const anyErr = err as { response?: { data?: unknown; status?: number } }
  const data = anyErr.response?.data
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null
}

function asStoreSummary(value: unknown): CartStoreSummary | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (typeof record.uuid !== 'string' || !record.uuid) return null
  return {
    uuid: record.uuid,
    store_name: typeof record.store_name === 'string' ? record.store_name : null,
  }
}

export function getCartStoreConflict(err: unknown): CartStoreConflict | null {
  const payload = readApiPayload(err)
  if (!payload) return null

  const errors = payload.errors
  if (typeof errors !== 'object' || errors === null || Array.isArray(errors)) return null

  const code = (errors as Record<string, unknown>).code
  if (code !== 'cart_store_conflict') return null

  const currentStore = asStoreSummary((errors as Record<string, unknown>).current_store)
  const incomingStore = asStoreSummary((errors as Record<string, unknown>).incoming_store)
  if (!currentStore || !incomingStore) return null

  const message =
    typeof payload.message === 'string' && payload.message.trim()
      ? payload.message.trim()
      : 'Your cart contains items from another store. Replacing your cart will remove those items.'

  return { message, currentStore, incomingStore }
}

export function isCartStoreConflictError(err: unknown): boolean {
  return getCartStoreConflict(err) !== null
}
