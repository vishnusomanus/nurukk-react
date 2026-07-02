import { formatCurrency } from '@/utils/formatCurrency'
import { cn } from '@/utils/cn'

export function OrderSummaryCard({
  subtotal,
  delivery,
  platformFee = 0,
  discount,
  total,
  itemCount,
  title = 'Order Summary',
  titleBorder = false,
  couponCode,
  className,
}: {
  subtotal: number
  delivery: number
  platformFee?: number
  discount: number
  total: number
  itemCount: number
  title?: string
  titleBorder?: boolean
  couponCode?: string | null
  className?: string
}) {
  return (
    <div className={className}>
      <h3
        className={cn(
          'text-headline-lg-mobile mb-4 text-on-surface lg:mb-6 lg:text-headline-lg',
          titleBorder && 'border-b border-outline-variant pb-2',
        )}
      >
        {title}
      </h3>
      <div className="space-y-4 text-body-md">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Item Subtotal</span>
          <span className="font-bold text-on-surface">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1">
            Delivery Fee
            <span className="material-symbols-outlined text-[14px] text-outline" title="Based on distance to seller">
              help
            </span>
          </span>
          <span className={delivery === 0 ? 'font-bold text-primary' : 'font-bold text-on-surface'}>
            {delivery === 0 ? 'FREE' : formatCurrency(delivery)}
          </span>
        </div>
        {platformFee > 0 ? (
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Platform Fee</span>
            <span className="font-bold text-on-surface">{formatCurrency(platformFee)}</span>
          </div>
        ) : null}
        {discount > 0 ? (
          <div className="flex items-center justify-between text-primary">
            <span>{couponCode ? `Discount (${couponCode})` : 'Discount'}</span>
            <span className="font-bold">-{formatCurrency(discount)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-dashed border-outline-variant pt-4 text-headline-lg-mobile font-bold lg:text-headline-lg">
          <span>Total Amount</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
