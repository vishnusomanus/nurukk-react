import {
  COUPON_USER_ELIGIBILITY,
  SELLER_COUPON_USER_ELIGIBILITY,
} from '@/api/services/adminCouponsService'
import type { CouponFormState } from '@/utils/couponForm'

type CouponAdvancedFieldsProps = {
  form: CouponFormState
  onChange: <K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) => void
  allowSpecificUsers?: boolean
}

export function CouponAdvancedFields({ form, onChange, allowSpecificUsers = false }: CouponAdvancedFieldsProps) {
  const eligibilityOptions = allowSpecificUsers ? COUPON_USER_ELIGIBILITY : SELLER_COUPON_USER_ELIGIBILITY
  const showMaxDiscount = form.type === 'percentage' || form.type === 'first_order'

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
      <h3 className="text-label-md font-bold tracking-wider text-on-surface-variant uppercase">
        Limits & validity
      </h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {showMaxDiscount ? (
          <label>
            <span className="text-label-md text-on-surface-variant">Max discount (₹)</span>
            <input
              value={form.maxDiscount}
              onChange={(e) => onChange('maxDiscount', e.target.value)}
              type="number"
              min={0}
              placeholder="No cap"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
            />
          </label>
        ) : null}
        <label>
          <span className="text-label-md text-on-surface-variant">Total usage limit</span>
          <input
            value={form.usageLimit}
            onChange={(e) => onChange('usageLimit', e.target.value)}
            type="number"
            min={1}
            placeholder="Unlimited"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          />
        </label>
        <label>
          <span className="text-label-md text-on-surface-variant">Uses per user</span>
          <input
            value={form.perUserUsageLimit}
            onChange={(e) => onChange('perUserUsageLimit', e.target.value)}
            type="number"
            min={1}
            placeholder="Unlimited"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          />
        </label>
        <label>
          <span className="text-label-md text-on-surface-variant">Valid from</span>
          <input
            value={form.startsAt}
            onChange={(e) => onChange('startsAt', e.target.value)}
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          />
        </label>
        <label>
          <span className="text-label-md text-on-surface-variant">Valid until</span>
          <input
            value={form.expiresAt}
            onChange={(e) => onChange('expiresAt', e.target.value)}
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          />
        </label>
      </div>

      <h3 className="text-label-md font-bold tracking-wider text-on-surface-variant uppercase">
        User eligibility
      </h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label>
          <span className="text-label-md text-on-surface-variant">Who can use this coupon?</span>
          <select
            value={form.userEligibility}
            onChange={(e) => onChange('userEligibility', e.target.value)}
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          >
            {eligibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {form.userEligibility === 'new_users' ? (
          <label>
            <span className="text-label-md text-on-surface-variant">Registered within (days)</span>
            <input
              value={form.newUserWithinDays}
              onChange={(e) => onChange('newUserWithinDays', e.target.value)}
              type="number"
              min={1}
              max={365}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
            />
          </label>
        ) : null}
      </div>

      {allowSpecificUsers && form.userEligibility === 'specific_users' ? (
        <label className="block">
          <span className="text-label-md text-on-surface-variant">Allowed user UUIDs (one per line)</span>
          <textarea
            value={form.allowedUserUuids}
            onChange={(e) => onChange('allowedUserUuids', e.target.value)}
            rows={3}
            placeholder="Paste buyer UUIDs from Users admin"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-mono text-body-md text-on-surface outline-none focus:border-primary"
          />
        </label>
      ) : null}
    </div>
  )
}
