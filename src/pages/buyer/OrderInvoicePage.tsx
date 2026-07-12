import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import { BuyerPageHeader } from '@/components/buyer/BuyerPageHeader'
import { BreadcrumbBackLink } from '@/components/common/BreadcrumbBack'
import { OrderInvoiceDocument } from '@/components/buyer/OrderInvoiceDocument'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { downloadInvoicePdf } from '@/utils/buyerAccount'

export function OrderInvoicePage() {
  const { orderUuid = '' } = useParams()
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'order', orderUuid, 'invoice'],
    queryFn: () => buyerService.getInvoice(orderUuid),
    enabled: !!orderUuid,
  })

  const invoice = data?.data?.invoice
  const orderNumber = data?.data?.order_number

  const handleDownloadPdf = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadInvoicePdf(orderUuid)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="app-page-pad-bottom-cta lg:pb-8">
      <BuyerPageHeader title="Invoice" backTo={`/buyer/orders/${orderUuid}/success`} />
      <div className="app-page-pad-top buyer-page-container py-6 lg:max-w-3xl lg:pt-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden lg:block">
            <BreadcrumbBackLink
              backTo={`/buyer/orders/${orderUuid}/success`}
              label="Back to order"
            />
            <h1 className="text-headline-sm mt-2 font-bold text-on-surface">Invoice</h1>
            {orderNumber ? (
              <p className="text-body-sm text-on-surface-variant">{orderNumber}</p>
            ) : null}
          </div>
          {orderNumber ? (
            <p className="text-body-sm text-on-surface-variant lg:hidden">{orderNumber}</p>
          ) : null}

          {invoice ? (
            <button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownloadPdf()}
              className="text-label-md inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-on-primary disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              {downloading ? 'Downloading…' : 'Download PDF'}
            </button>
          ) : null}
        </div>

        {downloadError ? (
          <div className="mb-4 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">
            {downloadError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-outline bg-surface p-10 text-center text-on-surface-variant">
            Loading invoice…
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-error/30 bg-error/5 p-6 text-error">
            {getApiErrorMessage(error, 'Could not load invoice')}
          </div>
        ) : null}

        {invoice ? <OrderInvoiceDocument invoice={invoice} /> : null}
      </div>
    </div>
  )
}
