import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  id: string
  uuid: string
  name: string
  email?: string
  phone?: string
  role: string
  available_roles?: string[]
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  setAuth: (args: { token: string; user: AuthUser }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ token, user }) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' },
  ),
)
