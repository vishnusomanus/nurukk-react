export function CheckoutFreshnessCard({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl bg-surface-container-low p-4 ${className ?? ''}`}
    >
      <div className="rounded-full bg-on-primary-container p-2">
        <span className="material-symbols-outlined text-primary">verified_user</span>
      </div>
      <div>
        <h4 className="text-label-md font-bold text-on-surface">Freshness Guaranteed</h4>
        <p className="text-[11px] text-on-surface-variant">
          Every item is checked for quality before dispatch.
        </p>
      </div>
    </div>
  )
}
