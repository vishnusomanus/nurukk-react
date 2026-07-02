import { BuyerAccountSidebar } from '@/components/buyer/BuyerAccountSidebar'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'

export function BuyerAccountShell({
  title,
  backTo = '/buyer/profile',
  children,
}: {
  title: string
  backTo?: string
  children: React.ReactNode
}) {
  return (
    <div className="pb-24 lg:pb-8">
      <BuyerPageHeader title={title} backTo={backTo} />
      <div className="mx-auto w-full max-w-screen-2xl pt-20 lg:pt-4">
        <div className="flex min-h-[calc(100vh-10rem)]">
          <BuyerAccountSidebar />
          <main className="min-w-0 flex-1 bg-surface-bright p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
