import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { HelpSupportForm } from '@/components/common/HelpSupportForm'

export function BuyerSupportPage() {
  return (
    <BuyerAccountShell title="Help & Support">
      <div className="mx-auto w-full max-w-2xl space-y-4 lg:space-y-6">
        <div className="hidden lg:block">
          <h1 className="text-headline-xl text-on-surface">Help & Support</h1>
          <p className="mt-1 text-body-lg text-on-surface-variant">
            Tell us what went wrong or what you need. Attach screenshots if it helps.
          </p>
        </div>

        <p className="text-sm text-on-surface-variant lg:hidden">
          Tell us what went wrong or what you need. Attach screenshots if it helps.
        </p>

        <div className="rounded-2xl bg-surface-container-lowest px-4 py-5 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          <HelpSupportForm app="buyer" />
        </div>
      </div>
    </BuyerAccountShell>
  )
}
