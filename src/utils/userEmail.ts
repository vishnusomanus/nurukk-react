/** Synthetic emails assigned for phone-only accounts — never show in UI. */
const PLACEHOLDER_EMAIL_SUFFIX = '@example.local'

export function isPlaceholderEmail(email?: string | null): boolean {
  const value = String(email ?? '').trim().toLowerCase()
  return value.length > 0 && value.endsWith(PLACEHOLDER_EMAIL_SUFFIX)
}

/** Value for email inputs / display. Placeholder emails render as empty. */
export function displayUserEmail(email?: string | null): string {
  if (!email || isPlaceholderEmail(email)) return ''
  return email.trim()
}

/**
 * Email to include in a profile update payload.
 * Empty input → omit (keep existing DB value, including placeholders).
 * Non-empty → save the new address.
 */
export function emailUpdatePayload(input: string): { email: string } | Record<string, never> {
  const trimmed = input.trim()
  if (!trimmed) return {}
  return { email: trimmed }
}
