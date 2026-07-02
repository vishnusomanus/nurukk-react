import { useAuthStore } from '@/store/authStore'
import { isAdminRole, isBuyerRole, isSellerRole } from '@/utils/authRole'

export function useRoleNav() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  return {
    user,
    role,
    isAdmin: isAdminRole(role),
    isBuyer: isBuyerRole(role),
    isSeller: isSellerRole(role),
  }
}
