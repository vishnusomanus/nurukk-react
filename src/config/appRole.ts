export type AppRole = 'buyer' | 'seller' | 'delivery' | 'all'

const envRole = import.meta.env.VITE_APP_ROLE

/** Build-time role — Vite inlines `import.meta.env.VITE_APP_ROLE` for dead-code elimination. */
export const APP_ROLE: AppRole =
  envRole === 'buyer' || envRole === 'seller' || envRole === 'delivery' || envRole === 'all'
    ? envRole
    : 'all'

export const isMultiPortalApp = APP_ROLE === 'all'

export const INCLUDE_BUYER = isMultiPortalApp || APP_ROLE === 'buyer'
export const INCLUDE_SELLER = isMultiPortalApp || APP_ROLE === 'seller'
export const INCLUDE_DELIVERY = isMultiPortalApp || APP_ROLE === 'delivery'
export const INCLUDE_ADMIN = isMultiPortalApp

/** Role switch (buyer ↔ seller) only on the multi-portal web build. */
export function allowsRoleSwitch() {
  return isMultiPortalApp
}

export function getAppLoginPath(role: AppRole = APP_ROLE) {
  if (role === 'seller') return '/login/seller'
  if (role === 'delivery') return '/login/delivery'
  if (role === 'buyer') return '/login/buyer'
  return '/'
}

export function getAppHomePath(role: AppRole = APP_ROLE) {
  if (role === 'seller') return '/seller'
  if (role === 'delivery') return '/delivery'
  if (role === 'buyer') return '/buyer'
  return '/'
}

export function getAppDisplayName(role: AppRole = APP_ROLE) {
  if (role === 'seller') return 'nurukk Seller'
  if (role === 'delivery') return 'nurukk Delivery'
  if (role === 'buyer') return 'nurukk'
  return 'nurukk'
}

export function authStorageKey(role: AppRole = APP_ROLE) {
  return role === 'all' ? 'auth-storage' : `auth-storage-${role}`
}

/** Whether this build should include a given portal role. */
export function includesAppRole(role: 'buyer' | 'seller' | 'delivery' | 'admin') {
  if (role === 'admin') return INCLUDE_ADMIN
  if (role === 'buyer') return INCLUDE_BUYER
  if (role === 'seller') return INCLUDE_SELLER
  return INCLUDE_DELIVERY
}
