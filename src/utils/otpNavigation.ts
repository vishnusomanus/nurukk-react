import type { OtpRole } from '@/api/services/authService'
import type { OtpMode } from '@/store/otpStore'

export type OtpNavigationState = {
  phone: string
  role: OtpRole
  mode: OtpMode
}

export function isOtpNavigationState(value: unknown): value is OtpNavigationState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.phone === 'string' &&
    v.phone.length === 10 &&
    typeof v.role === 'string' &&
    (v.mode === 'login' || v.mode === 'register')
  )
}

const OTP_QUERY_ROLES: OtpRole[] = ['buyer', 'seller', 'delivery_agent', 'seller_delivery']

function isOtpQueryRole(role: string | null): role is OtpRole {
  return role !== null && OTP_QUERY_ROLES.includes(role as OtpRole)
}

export function parseOtpSearchParams(searchParams: URLSearchParams): OtpNavigationState | null {
  const phone = searchParams.get('phone')?.replace(/\D/g, '') ?? ''
  const role = searchParams.get('role')
  const mode = searchParams.get('mode')

  if (phone.length !== 10) return null
  if (!isOtpQueryRole(role)) return null
  if (mode !== 'login' && mode !== 'register') return null

  return { phone, role, mode }
}
