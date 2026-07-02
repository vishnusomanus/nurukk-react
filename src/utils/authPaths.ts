import type { OtpRole } from '@/api/services/authService'
import type { OtpMode } from '@/store/otpStore'

export function getLoginPathForRole(role: OtpRole | 'admin' | 'staff' | 'seller_delivery') {
  const r = String(role).toLowerCase()
  if (r === 'admin' || r === 'staff') return '/login/admin'
  if (r === 'seller') return '/login/seller'
  if (r === 'delivery_agent' || r === 'seller_delivery') return '/login/delivery'
  return '/login/buyer'
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
