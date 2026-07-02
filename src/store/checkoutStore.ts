import { create } from 'zustand'
import type { CheckoutPaymentMethod } from '@/constants/paymentMethods'

type CheckoutState = {
  addressUuid: string | null
  paymentMethod: CheckoutPaymentMethod
  lastOrderUuid: string | null
  pendingPaymentOrderUuid: string | null
  setAddressUuid: (uuid: string | null) => void
  setPaymentMethod: (method: CheckoutPaymentMethod) => void
  setLastOrderUuid: (uuid: string | null) => void
  setPendingPaymentOrderUuid: (uuid: string | null) => void
  reset: () => void
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  addressUuid: null,
  paymentMethod: 'online',
  lastOrderUuid: null,
  pendingPaymentOrderUuid: null,
  setAddressUuid: (addressUuid) => set({ addressUuid }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setLastOrderUuid: (lastOrderUuid) => set({ lastOrderUuid }),
  setPendingPaymentOrderUuid: (pendingPaymentOrderUuid) => set({ pendingPaymentOrderUuid }),
  reset: () =>
    set({
      addressUuid: null,
      paymentMethod: 'online',
      lastOrderUuid: null,
      pendingPaymentOrderUuid: null,
    }),
}))
