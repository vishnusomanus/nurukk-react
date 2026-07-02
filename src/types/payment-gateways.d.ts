interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name?: string
  description?: string
  handler: (response: RazorpaySuccessResponse) => void
  modal?: { ondismiss?: () => void }
  prefill?: { name?: string; email?: string; contact?: string }
  method?: string
  theme?: { color?: string }
}

declare class Razorpay {
  constructor(options: RazorpayOptions)
  open(): void
  on(event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void): void
}

interface Window {
  Razorpay?: typeof Razorpay
  Cashfree?: (options: { mode: 'sandbox' | 'production' }) => CashfreeInstance
}

interface CashfreeCheckoutResult {
  error?: { message?: string }
  redirect?: boolean
  paymentDetails?: Record<string, unknown>
}

interface CashfreeInstance {
  checkout(options: {
    paymentSessionId: string
    redirectTarget?: '_self' | '_blank' | '_modal' | '_top'
  }): Promise<CashfreeCheckoutResult>
}

declare function Cashfree(options: { mode: 'sandbox' | 'production' }): CashfreeInstance
