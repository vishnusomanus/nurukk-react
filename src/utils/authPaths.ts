import type { OtpRole } from '@/api/services/authService'
import type { OtpMode } from '@/store/otpStore'
import { APP_ROLE, getAppLoginPath } from '@/config/appRole'

export function getLoginPathForRole(
  role: OtpRole | 'admin' | 'staff' | 'seller_delivery' | string | null | undefined,
) {
  const r = String(role ?? '').toLowerCase()
  if (r === 'admin' || r === 'staff') return '/login/admin'
  if (r === 'seller') return '/login/seller'
  if (r === 'delivery_agent' || r === 'seller_delivery' || r === 'delivery') return '/login/delivery'
  if (r === 'buyer') return '/login/buyer'
  const appLogin = getAppLoginPath(APP_ROLE)
  return appLogin === '/' ? '/login/buyer' : appLogin
}

/** Prefer route section, then auth role, then build-time app role. */
export function getLogoutRedirectPath(pathname?: string | null, role?: string | null) {
  const path = String(pathname ?? '')
  if (path.startsWith('/admin')) return '/login/admin'
  if (path.startsWith('/seller')) return '/login/seller'
  if (path.startsWith('/delivery')) return '/login/delivery'
  if (path.startsWith('/buyer')) return '/login/buyer'
  if (role) return getLoginPathForRole(role)
  return getLoginPathForRole(APP_ROLE === 'all' ? 'buyer' : APP_ROLE)
}

export function getRegisterPathForRole(role: 'buyer' | 'seller' | 'delivery_agent') {
  if (role === 'seller') return '/register/seller'
  if (role === 'delivery_agent') return '/register/delivery'
  return '/register/buyer'
}

export function getOtpBackPath(args: { mode: OtpMode; role: OtpRole }) {
  if (args.mode === 'register') {
    if (args.role === 'seller') return getRegisterPathForRole('seller')
    if (args.role === 'delivery_agent') return getRegisterPathForRole('delivery_agent')
    return getRegisterPathForRole('buyer')
  }
  return getLoginPathForRole(args.role)
}
