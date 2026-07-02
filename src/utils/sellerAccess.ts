import type { AuthUser } from '@/store/authStore'

export function canSwitchToSeller(user: AuthUser | null | undefined): boolean {
  return user?.available_roles?.includes('seller') === true
}

export function canSwitchToBuyer(user: AuthUser | null | undefined): boolean {
  const roles = user?.available_roles ?? []
  return roles.includes('buyer') || roles.includes('customer')
}

export function hasDualMarketplaceRoles(user: AuthUser | null | undefined): boolean {
  return canSwitchToSeller(user) && canSwitchToBuyer(user)
}
