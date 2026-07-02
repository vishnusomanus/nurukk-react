import { apiClient } from '@/api/client'
import type { GenericSuccess } from '@/types/api'
import type { AuthUser } from '@/store/authStore'

export type AuthLoginRequest = {
  email: string
  password: string
}

export type AuthLoginResponse = GenericSuccess<{
  token: string
  token_type: string
  expires_in: number
  user: AuthUser
}>

export type OtpRole = 'buyer' | 'seller' | 'customer' | 'delivery_agent' | 'seller_delivery'

export type RequestOtpPayload = {
  phone?: string
  email?: string
  role: OtpRole
}

export type VerifyOtpPayload = {
  phone?: string
  email?: string
  otp: string
  role: OtpRole
}

export type OtpAuthData = {
  token: string
  expires_in: number
  user: AuthUser & { phone?: string; available_roles?: string[] }
}

export async function login(payload: AuthLoginRequest) {
  const { data } = await apiClient.post<AuthLoginResponse>('/v1/auth/login', payload)
  return data
}

export async function requestOtp(payload: RequestOtpPayload) {
  const { data } = await apiClient.post<GenericSuccess<null>>('/v1/auth/request-otp', payload)
  return data
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const { data } = await apiClient.post<GenericSuccess<OtpAuthData>>('/v1/auth/verify-otp', payload)
  return data
}

export async function logout() {
  const { data } = await apiClient.post<GenericSuccess>('/v1/auth/logout')
  return data
}

export async function me() {
  const { data } = await apiClient.get<GenericSuccess<AuthUser>>('/v1/user')
  return data
}

export async function updateProfile(payload: {
  name?: string
  email?: string
  phone?: string | null
}) {
  const { data } = await apiClient.patch<GenericSuccess<AuthUser>>('/v1/user', payload)
  return data
}

export async function getAvailableRoles(params: { phone?: string; email?: string }) {
  const { data } = await apiClient.get<GenericSuccess<{ available_roles: string[] }>>(
    '/v1/auth/available-roles',
    {
      params,
    },
  )
  return data
}

export async function refreshToken() {
  const { data } = await apiClient.post<GenericSuccess<{ token: string; expires_in: number }>>('/v1/auth/refresh')
  return data
}

export async function revokeAllSessions() {
  const { data } = await apiClient.post<GenericSuccess>('/v1/auth/revoke-all')
  return data
}

export type AuthSession = {
  id: string | number
  name?: string
  revoked?: boolean
  expires_at?: string
  created_at?: string
}

export type AuthSessionsData = {
  sessions: AuthSession[]
}

export async function listSessions() {
  const { data } = await apiClient.get<GenericSuccess<AuthSessionsData>>('/v1/auth/sessions')
  return data
}

export async function switchRole(role: string) {
  const { data } = await apiClient.post<
    GenericSuccess<{ token: string; expires_in: number; user: AuthUser }>
  >('/v1/auth/switch-role', { role })
  return data
}
