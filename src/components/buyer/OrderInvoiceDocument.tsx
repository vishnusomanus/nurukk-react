import { formatCurrency } from '@/utils/formatCurrency'
import type { OrderInvoiceData } from '@/types/orderInvoice'
import { cn } from '@/utils/cn'

type OrderInvoiceDocumentProps = {
  invoice: OrderInvoiceData
  className?: string
}

export function OrderInvoiceDocument({ invoice, className }: OrderInvoiceDocumentProps) {
  const currency = invoice.currency ?? 'INR'

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-outline bg-surface text-on-surface shadow-sm',
        className,
      )}
    >
      <header className="bg-primary px-6 py-6 text-on-primary sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-label-md opacity-90">Tax Invoice</p>
            <h1 className="text-headline-md font-bold">{invoice.site_name}</h1>
            {invoice.site_email ? <p className="text-body-sm mt-1 opacity-90">{invoice.site_email}</p> : null}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-title-md font-bold">{invoice.invoice_number}</p>
            {invoice.issued_at ? <p className="text-body-sm mt-1 opacity-90">Issued: {invoice.issued_at}</p> : null}
            {invoice.delivered_at ? (
              <p className="text-body-sm opacity-90">Delivered: {invoice.delivered_at}</p>
            ) : null}
            <p className="text-label-md mt-2 inline-flex rounded-full bg-on-primary/15 px-3 py-1">
              {invoice.order_status_label}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 border-b border-outline px-6 py-6 sm:grid-cols-2 sm:px-8">
        <section>
          <p className="text-label-md text-on-surface-variant">Bill To</p>
          <p className="text-title-sm mt-2 font-semibold">{invoice.buyer.name}</p>
          {invoice.buyer.phone ? <p className="text-body-sm text-on-surface-variant">{invoice.buyer.phone}</p> : null}
          {invoice.buyer.email ? <p className="text-body-sm text-on-surface-variant">{invoice.buyer.email}</p> : null}
          <div className="text-body-sm mt-3 text-on-surface-variant">
            {invoice.delivery_address.label ? <p>{invoice.delivery_address.label}</p> : null}
            {invoice.delivery_address.line ? <p>{invoice.delivery_address.line}</p> : null}
            {(invoice.delivery_address.city || invoice.delivery_address.pincode) && (
              <p>
                {[invoice.delivery_address.city, invoice.delivery_address.pincode].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
        </section>

        <section>
          <p className="text-label-md text-on-surface-variant">Sold By</p>
          <p className="text-title-sm mt-2 font-semibold">{invoice.seller.store_name}</p>
          {invoice.seller.address_line ? (
            <p className="text-body-sm text-on-surface-variant">{invoice.seller.address_line}</p>
          ) : null}
          {(invoice.seller.city || invoice.seller.pincode) && (
            <p className="text-body-sm text-on-surface-variant">
              {[invoice.seller.city, invoice.seller.pincode].filter(Boolean).join(' ')}
            </p>
          )}
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant">Payment</p>
            <p className="text-body-sm mt-1">
              {invoice.payment_method} · {invoice.payment_status}
            </p>
            {invoice.delivery_type ? (
              <p className="text-body-sm text-on-surface-variant">{invoice.delivery_type}</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="overflow-x-auto px-4 sm:px-8">
        <table className="w-full min-w-[520px] border-collapse text-body-sm">
          <thead>
            <tr className="border-b border-outline text-left text-label-md text-on-surface-variant">
              <th className="py-3 pr-4 font-medium">Item</th>
              <th className="py-3 px-2 text-right font-medium">Qty</th>
              <th className="py-3 px-2 text-right font-medium">Rate</th>
              <th className="py-3 pl-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={`${item.name}-${item.quantity}-${item.unit_price}`} className="border-b border-outline/70">
                <td className="py-3 pr-4">
                  <p className="font-medium">{item.name}</p>
                  {item.unit ? <p className="text-body-sm text-on-surface-variant">{item.unit}</p> : null}
                </td>
                <td className="py-3 px-2 text-right">{item.quantity}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(item.unit_price, currency)}</td>
                <td className="py-3 pl-2 text-right font-medium">{formatCurrency(item.subtotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end px-6 py-6 sm:px-8">
        <dl className="w-full max-w-xs space-y-2 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Subtotal</dt>
            <dd>{formatCurrency(invoice.subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Delivery charge</dt>
            <dd>{formatCurrency(invoice.delivery_charge, currency)}</dd>
          </div>
          {invoice.platform_fee > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Platform Fee</dt>
              <dd>{formatCurrency(invoice.platform_fee, currency)}</dd>
            </div>
          ) : null}
          {invoice.discount > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">
                Discount{invoice.coupon_code ? ` (${invoice.coupon_code})` : ''}
              </dt>
              <dd className="text-primary">-{formatCurrency(invoice.discount, currency)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-outline pt-3 text-title-sm font-bold text-primary">
            <dt>Total</dt>
            <dd>{formatCurrency(invoice.total, currency)}</dd>
          </div>
        </dl>
      </div>

      {invoice.notes ? (
        <div className="border-t border-outline px-6 py-4 sm:px-8">
          <p className="text-label-md text-on-surface-variant">Order Notes</p>
          <p className="text-body-sm mt-1">{invoice.notes}</p>
        </div>
      ) : null}

      <footer className="border-t border-outline bg-surface-container-low px-6 py-4 text-body-sm text-on-surface-variant sm:px-8">
        This is a computer-generated invoice from {invoice.site_name}. Thank you for your order.
      </footer>
    </article>
  )
}
