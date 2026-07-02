import { APP_NAME } from '@/constants/app'
import type { CheckoutPaymentMethod, OnlinePaymentMethod } from '@/constants/paymentMethods'
import type {
  CashfreeClientPayload,
  PaymentGateway,
  PaymentInitiateData,
  RazorpayClientPayload,
} from '@/api/services/paymentService'
import type { AuthUser } from '@/store/authStore'

export type PaymentCheckoutResult = 'paid' | 'dismissed' | 'failed'

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
const CASHFREE_SCRIPT = 'https://sdk.cashfree.com/js/v3/cashfree.js'

function loadScript(src: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing?.dataset.loaded === 'true') {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${id}`))
    if (!existing) document.head.appendChild(script)
  })
}

async function waitForGlobal<T>(
  read: () => T | undefined,
  label: string,
  timeoutMs = 8000,
): Promise<T> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const value = read()
    if (value) return value
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }
  throw new Error(`${label} SDK failed to load`)
}

export async function preloadPaymentGateway(gateway?: PaymentGateway): Promise<void> {
  if (gateway === 'razorpay') {
    await loadScript(RAZORPAY_SCRIPT, 'razorpay-checkout-js')
    return
  }
  if (gateway === 'cashfree') {
    await loadScript(CASHFREE_SCRIPT, 'cashfree-checkout-js')
  }
}

function razorpayMethod(method: OnlinePaymentMethod): string | undefined {
  if (method === 'card') return 'card'
  if (method === 'upi') return 'upi'
  return undefined
}

function isRazorpayClient(client: unknown): client is RazorpayClientPayload {
  return (
    typeof client === 'object' &&
    client !== null &&
    'key_id' in client &&
    'order_id' in client &&
    'amount' in client
  )
}

function isCashfreeClient(client: unknown): client is CashfreeClientPayload {
  return (
    typeof client === 'object' &&
    client !== null &&
    'payment_session_id' in client &&
    'order_id' in client
  )
}

function cashfreeMode(environment?: string): 'sandbox' | 'production' {
  return environment === 'production' ? 'production' : 'sandbox'
}

async function openRazorpayCheckout(
  initiate: PaymentInitiateData,
  paymentMethod: OnlinePaymentMethod,
  user: AuthUser | null,
): Promise<PaymentCheckoutResult> {
  const client = initiate.client
  if (!isRazorpayClient(client)) {
    throw new Error('Invalid Razorpay checkout payload')
  }

  await loadScript(RAZORPAY_SCRIPT, 'razorpay-checkout-js')

  const RazorpayCtor = await waitForGlobal(() => window.Razorpay, 'Razorpay')

  return new Promise((resolve) => {
    const method = razorpayMethod(paymentMethod)
    const rzp = new RazorpayCtor({
      key: client.key_id,
      amount: client.amount,
      currency: client.currency,
      order_id: client.order_id,
      name: APP_NAME,
      description: 'Order payment',
      method,
      theme: { color: '#0d631b' },
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: user?.phone,
      },
      handler: () => resolve('paid'),
      modal: {
        ondismiss: () => resolve('dismissed'),
      },
    })

    rzp.on('payment.failed', () => resolve('failed'))
    rzp.open()
  })
}

async function openCashfreeCheckout(initiate: PaymentInitiateData): Promise<PaymentCheckoutResult> {
  const client = initiate.client
  if (!isCashfreeClient(client)) {
    throw new Error('Invalid Cashfree checkout payload')
  }

  await loadScript(CASHFREE_SCRIPT, 'cashfree-checkout-js')

  const CashfreeCtor = await waitForGlobal(() => window.Cashfree, 'Cashfree')
  const mode = cashfreeMode(client.environment)

  const cashfree = CashfreeCtor({ mode })
  const result = await cashfree.checkout({
    paymentSessionId: client.payment_session_id,
    redirectTarget: '_modal',
  })

  if (result.error) {
    const message =
      typeof result.error === 'object' && result.error && 'message' in result.error
        ? String((result.error as { message?: string }).message)
        : ''
    throw new Error(
      message ||
        'Cashfree checkout could not open. Whitelist your site domain (e.g. localhost) in the Cashfree sandbox dashboard.',
    )
  }
  if (result.paymentDetails) return 'paid'
  return 'dismissed'
}

/** Opens Razorpay modal or Cashfree checkout from initiate API response. */
export async function openPaymentGateway(args: {
  initiate: PaymentInitiateData
  paymentMethod: OnlinePaymentMethod
  user: AuthUser | null
}): Promise<PaymentCheckoutResult> {
  const gateway = args.initiate.gateway

  if (gateway === 'razorpay') {
    return openRazorpayCheckout(args.initiate, args.paymentMethod, args.user)
  }

  if (gateway === 'cashfree') {
    return openCashfreeCheckout(args.initiate)
  }

  throw new Error(`Unsupported payment gateway: ${gateway}`)
}

export function gatewayLabel(gateway?: PaymentGateway): string {
  if (gateway === 'cashfree') return 'Cashfree'
  if (gateway === 'razorpay') return 'Razorpay'
  return 'Payment gateway'
}
