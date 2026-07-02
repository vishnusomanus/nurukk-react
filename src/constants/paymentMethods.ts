export const CHECKOUT_PAYMENT_METHODS = [
  {
    id: 'online',
    label: 'Pay Online',
    description: 'UPI, credit/debit cards, and more in the secure payment portal',
    icon: 'account_balance_wallet',
    online: true,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    icon: 'payments',
    online: false,
  },
] as const

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number]['id']

/** Online methods accepted by the payment initiate API (includes legacy order values). */
export type OnlinePaymentMethod = 'online' | 'upi' | 'card'

export function isOnlineCheckoutMethod(method: string): boolean {
  return method !== 'cod'
}
