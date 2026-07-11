import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService, paymentService } from '@/api/services'
import { CHECKOUT_PAYMENT_METHODS, isOnlineCheckoutMethod } from '@/constants/paymentMethods'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { CheckoutDeliveryAddress } from '@/components/buyer/CheckoutDeliveryAddress'
import { OrderSummaryCard } from '@/components/buyer/OrderSummaryCard'
import { useCheckoutStore } from '@/store/checkoutStore'
import { useCheckoutAddress } from '@/hooks/useCheckoutAddress'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { resolveCheckoutTotals } from '@/utils/checkoutSummary'
import { gatewayLabel, openPaymentGateway, preloadPaymentGateway } from '@/utils/paymentCheckout'
import { cn } from '@/utils/cn'

export function PaymentSelectionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { addressUuid, hasAddress, isLoading: addressesLoading, addresses, setAddressUuid } = useCheckoutAddress()
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod)
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod)
  const setLastOrderUuid = useCheckoutStore((s) => s.setLastOrderUuid)
  const pendingPaymentOrderUuid = useCheckoutStore((s) => s.pendingPaymentOrderUuid)
  const setPendingPaymentOrderUuid = useCheckoutStore((s) => s.setPendingPaymentOrderUuid)
  const [formError, setFormError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'gateway'>('idle')

  const { data: cartData } = useQuery({
    queryKey: ['buyer', 'cart'],
    queryFn: () => buyerService.getCart(),
  })

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['buyer', 'checkout-preview', addressUuid],
    queryFn: () =>
      buyerService.getCheckoutPreview(
        addressUuid ? { address_uuid: addressUuid, delivery_type: 'platform' } : undefined,
      ),
    enabled: !pendingPaymentOrderUuid && !!addressUuid && (cartData?.data?.items?.length ?? 0) > 0,
  })

  const { data: pendingOrderData } = useQuery({
    queryKey: ['buyer', 'order', pendingPaymentOrderUuid],
    queryFn: () => buyerService.getOrder(pendingPaymentOrderUuid!),
    enabled: !!pendingPaymentOrderUuid,
  })

  const cart = cartData?.data

  const totals = pendingPaymentOrderUuid
    ? {
        subtotal: Number(pendingOrderData?.data?.subtotal ?? 0),
        delivery: Number(pendingOrderData?.data?.delivery_charge ?? 0),
        platformFee: Number(pendingOrderData?.data?.platform_fee ?? 0),
        discount: Number(pendingOrderData?.data?.discount ?? 0),
        total: Number(pendingOrderData?.data?.total ?? 0),
        itemCount: pendingOrderData?.data?.items?.length ?? 0,
      }
    : resolveCheckoutTotals(previewData?.data, cart)
  const { data: paymentConfigData } = useQuery({
    queryKey: ['payments', 'config'],
    queryFn: () => paymentService.getPaymentConfig(),
  })

  const activeGateway = paymentConfigData?.data?.gateway
  const codEnabled = paymentConfigData?.data?.cod_enabled !== false
  const hasPendingOrder = !!pendingPaymentOrderUuid

  const availableMethods = useMemo(
    () => CHECKOUT_PAYMENT_METHODS.filter((method) => method.id !== 'cod' || codEnabled),
    [codEnabled],
  )

  useEffect(() => {
    if (!codEnabled && paymentMethod === 'cod') {
      setPaymentMethod('online')
    }
  }, [codEnabled, paymentMethod, setPaymentMethod])

  useEffect(() => {
    if (isOnlineCheckoutMethod(paymentMethod) && activeGateway) {
      preloadPaymentGateway(activeGateway).catch(() => {
        // SDK preload is best-effort.
      })
    }
  }, [paymentMethod, activeGateway])

  const pay = useMutation({
    mutationFn: async () => {
      if (!addressUuid) throw new Error('Add a delivery address to continue')

      setPhase('preparing')

      let orderUuid = pendingPaymentOrderUuid

      if (!orderUuid) {
        const orderRes = await buyerService.checkout({
          address_uuid: addressUuid,
          payment_method: paymentMethod,
          delivery_type: 'platform',
        })
        const order = orderRes.data
        if (!order?.uuid) throw new Error('Order could not be created')
        orderUuid = order.uuid
        setPendingPaymentOrderUuid(orderUuid)
        queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] })
      }

      if (paymentMethod === 'cod') {
        return { orderUuid, outcome: 'cod' as const }
      }

      const payRes = await paymentService.initiatePayment({
        order_uuid: orderUuid,
        payment_method: paymentMethod,
      })
      const initiate = payRes.data

      if (!initiate?.payment_uuid || !initiate.gateway) {
        throw new Error('Payment could not be initiated')
      }

      if (!initiate.client || (initiate.gateway === 'cashfree' && !('payment_session_id' in initiate.client))) {
        throw new Error('Payment gateway session is missing. Check Cashfree/Razorpay credentials on the server.')
      }

      setPhase('gateway')

      const gatewayResult = await openPaymentGateway({
        initiate,
        paymentMethod,
        user,
      })

      if (gatewayResult === 'paid') {
        await paymentService.verifyPayment({
          payment_uuid: initiate.payment_uuid,
          gateway: initiate.gateway,
        })
        const statusRes = await paymentService.getPaymentStatus(initiate.payment_uuid)
        if (statusRes.data?.status && statusRes.data.status !== 'paid') {
          throw new Error('Payment is still processing. Please try again in a moment.')
        }
        return { orderUuid, outcome: 'paid' as const }
      }

      if (gatewayResult === 'failed') {
        return { orderUuid, outcome: 'failed' as const }
      }

      return { orderUuid, outcome: 'dismissed' as const }
    },
    onSuccess: ({ orderUuid, outcome }) => {
      setPhase('idle')
      queryClient.invalidateQueries({ queryKey: ['buyer', 'orders'] })
      setLastOrderUuid(orderUuid)

      if (outcome === 'dismissed') {
        setFormError('Payment cancelled. Tap Pay Now to open the gateway again.')
        return
      }

      if (outcome === 'failed') {
        setFormError('Payment failed. Tap Pay Now to try again.')
        return
      }

      setPendingPaymentOrderUuid(null)
      navigate(`/buyer/orders/${orderUuid}/success`, { replace: true })
    },
    onError: (err: unknown) => {
      setPhase('idle')
      setFormError(getApiErrorMessage(err, 'Could not open payment gateway'))
    },
  })

  const isOnline = isOnlineCheckoutMethod(paymentMethod)
  const isBusy = pay.isPending

  const payLabel =
    phase === 'gateway'
      ? `Opening ${gatewayLabel(activeGateway)}…`
      : phase === 'preparing'
        ? hasPendingOrder
          ? 'Resuming payment…'
          : 'Placing order…'
        : isOnline
          ? hasPendingOrder
            ? `Retry ${gatewayLabel(activeGateway)} Payment`
            : `Pay Now with ${gatewayLabel(activeGateway)}`
          : 'Place Order'

  const payBtn = (
    <button
      type="button"
      disabled={isBusy || !hasAddress || (!hasPendingOrder && totals.itemCount === 0 && totals.total <= 0)}
      onClick={() => {
        setFormError(null)
        pay.mutate()
      }}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-on-primary shadow-lg transition-all active:scale-[0.98] hover:bg-primary-container disabled:opacity-60 lg:rounded-xl"
    >
      {payLabel}
      <span className="material-symbols-outlined">{isOnline ? 'lock' : 'check_circle'}</span>
    </button>
  )

  const paymentMethods = (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-label-md ml-1 tracking-wider text-on-surface-variant uppercase lg:text-headline-lg lg:normal-case lg:tracking-normal lg:text-on-surface">
          Payment Methods
        </h3>
        {activeGateway && isOnline ? (
          <span className="text-label-md rounded-full bg-surface-container-low px-3 py-1 text-on-surface-variant">
            {gatewayLabel(activeGateway)}
            {paymentConfigData?.data?.client?.environment
              ? ` · ${paymentConfigData.data.client.environment}`
              : ''}
          </span>
        ) : null}
      </div>
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {availableMethods.map((method) => (
          <label
            key={method.id}
            className={cn(
              'flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low lg:border-outline-variant lg:bg-surface lg:shadow-[0px_4px_20px_rgba(0,0,0,0.05)] lg:hover:border-primary',
              paymentMethod === method.id && 'border-primary/30 bg-primary-fixed/10 lg:border-primary',
            )}
          >
            <div className="flex min-w-0 items-start gap-4">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-secondary">{method.icon}</span>
              <div className="min-w-0">
                <span className="text-body-lg block font-semibold text-on-surface">{method.label}</span>
                {'description' in method && method.description ? (
                  <span className="text-body-md mt-1 block text-on-surface-variant">{method.description}</span>
                ) : null}
              </div>
            </div>
            <input
              type="radio"
              name="payment_method"
              checked={paymentMethod === method.id}
              onChange={() => setPaymentMethod(method.id)}
              className="mt-1 h-5 w-5 shrink-0 accent-primary"
            />
          </label>
        ))}
      </div>
    </section>
  )

  const summaryCard =
    (previewLoading || (pendingPaymentOrderUuid && !pendingOrderData)) && !totals.total ? (
      <div className="h-40 animate-pulse rounded-xl bg-surface-container" />
    ) : (
    <OrderSummaryCard
      subtotal={totals.subtotal}
      delivery={totals.delivery}
      platformFee={totals.platformFee}
      discount={totals.discount}
      total={totals.total}
      itemCount={totals.itemCount}
    />
  )

  return (
    <div className="pb-28 lg:pb-8">
      <BuyerPageHeader title="Payment Method" backTo="/buyer/checkout" />

      <main className="app-page-pad-top buyer-page-container mb-4 flex-1 scroll-touch lg:mb-0 lg:pt-8">
        <h1 className="text-headline-xl mb-6 hidden text-on-surface lg:block">Complete Payment</h1>

        {!addressesLoading && !hasAddress ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            No delivery address found.{' '}
            <Link to="/buyer/addresses" className="font-semibold text-primary underline">
              Add an address
            </Link>{' '}
            to continue.
          </p>
        ) : null}

        {hasPendingOrder ? (
          <p className="mb-4 rounded-xl border border-primary/20 bg-primary-fixed/10 px-3 py-2 text-sm text-on-surface">
            Your order is placed. Complete payment to confirm it.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {hasAddress || addresses.length > 0 ? (
              <CheckoutDeliveryAddress
                addresses={addresses}
                selectedUuid={addressUuid}
                onSelect={setAddressUuid}
                allowEdit
                readOnly={hasPendingOrder}
              />
            ) : null}

            <div className="lg:hidden">{summaryCard}</div>
            {paymentMethods}
          </div>

          <div className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-28 rounded-xl border border-surface-container-highest bg-surface p-6 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
              {summaryCard}
              <div className="mt-6">{payBtn}</div>
              <p className="mt-4 flex items-center justify-center gap-1 text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">lock</span>
                {isOnline && activeGateway
                  ? `Encrypted checkout powered by ${gatewayLabel(activeGateway)}`
                  : 'Secure encrypted payment'}
              </p>
            </div>
          </div>
        </div>

        {formError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {formError}
          </div>
        ) : null}
      </main>

      <div className="app-cta-safe fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-lg px-margin-mobile pt-3 lg:hidden">
        {payBtn}
      </div>
    </div>
  )
}
