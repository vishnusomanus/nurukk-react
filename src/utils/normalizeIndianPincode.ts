function normalizeIndianPincode(raw?: string) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 6) return digits.slice(0, 6)
  return raw.trim()
}

export { normalizeIndianPincode }
