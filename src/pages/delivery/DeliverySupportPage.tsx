import { HelpSupportForm } from '@/components/common/HelpSupportForm'

export function DeliverySupportPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4 md:px-6 md:py-6">
      {/* Layout header already shows the title on all breakpoints — avoid a second H1. */}
      <p className="text-sm text-on-surface-variant md:text-base">
        Report delivery issues or ask for account help. Screenshots welcome.
      </p>

      <div className="rounded-2xl bg-surface p-4 shadow-sm md:rounded-xl md:border md:border-outline-variant/30 md:p-6 md:shadow-none">
        <HelpSupportForm app="delivery" />
      </div>
    </div>
  )
}
