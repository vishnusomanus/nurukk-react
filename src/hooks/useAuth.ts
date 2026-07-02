import { create } from 'zustand'
import { useAuthStore, type AuthUser } from '@/store/authStore'
import * as authService from '@/api/services/authService'
import type { OtpRole } from '@/api/services/authService'

function normalizeToken(token: string) {
  return token.startsWith('Bearer ') ? token.slice(7) : token
}

type AuthFacade = {
  initUser: () => Promise<void>
  updateProfile: (payload: { name?: string; email?: string; phone?: string | null }) => Promise<AuthUser>
  isAuthenticated: () => boolean
  loginWithPassword: (args: { email: string; password: string }) => Promise<void>
  requestOtp: (args: { phone?: string; email?: string; role: OtpRole }) => Promise<void>
  verifyOtp: (args: { phone?: string; email?: string; otp: string; role: OtpRole }) => Promise<void>
  switchRole: (role: 'buyer' | 'seller') => Promise<AuthUser | undefined>
  logout: () => Promise<void>
}

export const useAuth = create<AuthFacade>(() => ({
  initUser: async () => {
    const { token } = useAuthStore.getState()
    if (!token) return
    try {
      const res = await authService.me()
      const user = res.data as AuthUser
      let availableRoles = user.available_roles
      if (user.phone && !availableRoles?.length) {
        try {
          const rolesRes = await authService.getAvailableRoles({ phone: user.phone })
          availableRoles = rolesRes.data?.available_roles
        } catch {
          // Role lookup is optional; profile still loads without it.
        }
      }
      useAuthStore.setState({ user: { ...user, available_roles: availableRoles } })
    } catch {
      useAuthStore.getState().clearAuth()
    }
  },
  updateProfile: async (payload) => {
    const res = await authService.updateProfile(payload)
    const user = res.data as AuthUser
    useAuthStore.setState({ user })
    return user
  },
  isAuthenticated: () => !!useAuthStore.getState().token,
  loginWithPassword: async ({ email, password }) => {
    const res = await authService.login({ email, password })
    useAuthStore.getState().setAuth({
      token: normalizeToken(res.data.token),
      user: res.data.user,
    })
  },
  requestOtp: async ({ phone, email, role }) => {
    await authService.requestOtp({ phone, email, role })
  },
  verifyOtp: async ({ phone, email, otp, role }) => {
    const res = await authService.verifyOtp({ phone, email, otp, role })
    useAuthStore.getState().setAuth({
      token: normalizeToken(res.data.token),
      user: res.data.user as AuthUser,
    })
  },
  switchRole: async (role: 'buyer' | 'seller') => {
    const res = await authService.switchRole(role)
    const { token, user } = useAuthStore.getState()
    const nextUser = res.data?.user as AuthUser | undefined
    if (token && nextUser) {
      useAuthStore.getState().setAuth({
        token,
        user: {
          ...(user ?? nextUser),
          ...nextUser,
          available_roles: nextUser.available_roles ?? user?.available_roles,
        },
      })
    }
    return nextUser
  },
  logout: async () => {
    try {
      await authService.logout()
    } finally {
      useAuthStore.getState().clearAuth()
    }
  },
}))
