import {
  COUPON_USER_ELIGIBILITY,
  SELLER_COUPON_USER_ELIGIBILITY,
} from '@/api/services/adminCouponsService'
import type { CouponFormState } from '@/utils/couponForm'
import { cn } from '@/utils/cn'

type CouponAdvancedFieldsProps = {
  form: CouponFormState
  onChange: <K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) => void
  allowSpecificUsers?: boolean
  inputClassName?: string
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block px-0.5 text-xs font-semibold text-on-surface-variant">{children}</span>
}

export function CouponAdvancedFields({
  form,
  onChange,
  allowSpecificUsers = false,
  inputClassName,
}: CouponAdvancedFieldsProps) {
  const eligibilityOptions = allowSpecificUsers ? COUPON_USER_ELIGIBILITY : SELLER_COUPON_USER_ELIGIBILITY
  const showMaxDiscount = form.type === 'percentage' || form.type === 'first_order'
  const fieldClass =
    inputClassName ??
    'w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20'

  return (
    <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none">
      <h3 className="text-sm font-bold text-on-surface">Limits & validity</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {showMaxDiscount ? (
          <label className="block">
            <FieldLabel>Max discount (₹)</FieldLabel>
            <input
              value={form.maxDiscount}
              onChange={(e) => onChange('maxDiscount', e.target.value)}
              type="number"
              min={0}
              placeholder="No cap"
              inputMode="decimal"
              className={fieldClass}
            />
          </label>
        ) : null}
        <label className="block">
          <FieldLabel>Total usage limit</FieldLabel>
          <input
            value={form.usageLimit}
            onChange={(e) => onChange('usageLimit', e.target.value)}
            type="number"
            min={1}
            placeholder="Unlimited"
            inputMode="numeric"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Uses per user</FieldLabel>
          <input
            value={form.perUserUsageLimit}
            onChange={(e) => onChange('perUserUsageLimit', e.target.value)}
            type="number"
            min={1}
            placeholder="Unlimited"
            inputMode="numeric"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Valid from</FieldLabel>
          <input
            value={form.startsAt}
            onChange={(e) => onChange('startsAt', e.target.value)}
            type="datetime-local"
            className={fieldClass}
          />
        </label>
        <label className={cn('block', showMaxDiscount ? 'sm:col-span-2' : '')}>
          <FieldLabel>Valid until</FieldLabel>
          <input
            value={form.expiresAt}
            onChange={(e) => onChange('expiresAt', e.target.value)}
            type="datetime-local"
            className={fieldClass}
          />
        </label>
      </div>

      <h3 className="text-sm font-bold text-on-surface">User eligibility</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <FieldLabel>Who can use this coupon?</FieldLabel>
          <select
            value={form.userEligibility}
            onChange={(e) => onChange('userEligibility', e.target.value)}
            className={fieldClass}
          >
            {eligibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {form.userEligibility === 'new_users' ? (
          <label className="block sm:col-span-2">
            <FieldLabel>Registered within (days)</FieldLabel>
            <input
              value={form.newUserWithinDays}
              onChange={(e) => onChange('newUserWithinDays', e.target.value)}
              type="number"
              min={1}
              max={365}
              inputMode="numeric"
              className={fieldClass}
            />
          </label>
        ) : null}
      </div>

      {allowSpecificUsers && form.userEligibility === 'specific_users' ? (
        <label className="block">
          <FieldLabel>Allowed user UUIDs (one per line)</FieldLabel>
          <textarea
            value={form.allowedUserUuids}
            onChange={(e) => onChange('allowedUserUuids', e.target.value)}
            rows={3}
            placeholder="Paste buyer UUIDs from Users admin"
            className={cn(fieldClass, 'resize-none font-mono text-xs')}
          />
        </label>
      ) : null}
    </div>
  )
}
