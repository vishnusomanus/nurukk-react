import { BuyerAccountSidebar } from '@/components/buyer/BuyerAccountSidebar'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'

export function BuyerAccountShell({
  title,
  backTo = '/buyer/profile',
  showBack = true,
  children,
}: {
  title: string
  backTo?: string
  showBack?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="app-page-pad-bottom lg:pb-8">
      <BuyerPageHeader title={title} backTo={backTo} showBack={showBack} />
      <div className="app-page-pad-top mx-auto w-full max-w-screen-2xl lg:pt-4">
        <div className="flex min-h-[calc(100dvh-10rem)]">
          <BuyerAccountSidebar />
          <main className="min-w-0 flex-1 bg-surface-bright p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
