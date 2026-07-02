export type UnknownRecord = Record<string, unknown>

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function extractRows(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord)
  if (isRecord(payload) && Array.isArray(payload.data)) return payload.data.filter(isRecord)
  return []
}
