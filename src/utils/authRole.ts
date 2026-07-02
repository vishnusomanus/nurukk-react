export function normalizeRole(role?: string | null) {
  return String(role ?? '').toLowerCase()
}

export function getHomePathForRole(role?: string | null) {
  const r = normalizeRole(role)
  if (r === 'admin' || r === 'staff') return '/admin'
  if (r === 'seller') return '/seller'
  if (r === 'delivery_agent' || r === 'seller_delivery') return '/delivery'
  if (r === 'buyer' || r === 'customer') return '/buyer'
  return '/'
}

export function isAdminRole(role?: string | null) {
  return ['admin', 'staff'].includes(normalizeRole(role))
}

export function isBuyerRole(role?: string | null) {
  return ['buyer', 'customer'].includes(normalizeRole(role))
}

export function isSellerRole(role?: string | null) {
  return normalizeRole(role) === 'seller'
}
