import { BuyerAccountSidebar } from '@/components/buyer/BuyerAccountSidebar'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'

export function BuyerAccountShell({
  title,
  backTo = '/buyer/profile',
  showBack = true,
  right,
  children,
}: {
  title: string
  backTo?: string
  showBack?: boolean
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="app-page-pad-bottom lg:pb-8">
      <BuyerPageHeader title={title} backTo={backTo} showBack={showBack} right={right} />
      <div className="app-page-pad-top mx-auto w-full max-w-screen-2xl lg:pt-4">
        <div className="flex min-h-[calc(100dvh-10rem)]">
          <BuyerAccountSidebar />
          <main className="buyer-page-container min-w-0 flex-1 space-y-4 pb-4 lg:max-w-none lg:bg-surface-bright lg:p-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
