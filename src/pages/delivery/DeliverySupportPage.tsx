import { HelpSupportForm } from '@/components/common/HelpSupportForm'
import { DeliveryPageShell } from '@/components/delivery/DeliveryPageShell'

export function DeliverySupportPage() {
  return (
    <DeliveryPageShell pathname="/delivery/support">
      <p className="text-sm leading-relaxed text-on-surface-variant">
        Report delivery issues or ask for account help. Screenshots welcome.
      </p>

      <div className="rounded-[1.75rem] bg-surface p-4 shadow-[0_4px_20px_-10px_rgba(15,40,20,0.14)] sm:p-5">
        <HelpSupportForm app="delivery" />
      </div>
    </DeliveryPageShell>
  )
}
