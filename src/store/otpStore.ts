import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OtpRole } from '@/api/services/authService'

export type OtpMode = 'login' | 'register'

export type OtpPending = {
  phone?: string
  email?: string
  role: OtpRole
  mode: OtpMode
}

type OtpState = {
  pending: OtpPending | null
  setPending: (pending: OtpPending) => void
  clearPending: () => void
}

export const useOtpStore = create<OtpState>()(
  persist(
    (set) => ({
      pending: null,
      setPending: (pending) => set({ pending }),
      clearPending: () => set({ pending: null }),
    }),
    {
      name: 'veg-otp-pending',
      partialize: (state) => ({ pending: state.pending }),
    },
  ),
)
