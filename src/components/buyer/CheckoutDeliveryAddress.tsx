import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerAddress, BuyerAddressPayload } from '@/api/services/buyerService'
import { AddressFormModal } from '@/components/buyer/AddressFormModal'
import { addressLabelIcon, formatBuyerAddressLines } from '@/utils/buyerAddress'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export function CheckoutDeliveryAddress({
  addresses,
  selectedUuid,
  onSelect,
  allowEdit = true,
  readOnly = false,
  className,
}: {
  addresses: BuyerAddress[]
  selectedUuid: string | null
  onSelect: (uuid: string) => void
  allowEdit?: boolean
  readOnly?: boolean
  className?: string
}) {
  const queryClient = useQueryClient()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<BuyerAddress | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const selected = addresses.find((a) => a.uuid === selectedUuid) ?? null

  const saveMutation = useMutation({
    mutationFn: (payload: BuyerAddressPayload) =>
      editingAddress
        ? buyerService.updateAddress(editingAddress.uuid, payload)
        : buyerService.createAddress(payload),
    onSuccess: (res) => {
      const saved = res.data
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'addresses'] })
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'checkout-preview'] })
      if (saved?.uuid) onSelect(saved.uuid)
      setFormOpen(false)
      setEditingAddress(null)
      setFormError(null)
      setPickerOpen(false)
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, 'Failed to save address'))
    },
  })

  const openCreate = () => {
    setEditingAddress(null)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (address: BuyerAddress) => {
    setEditingAddress(address)
    setFormError(null)
    setFormOpen(true)
  }

  if (addresses.length === 0) {
    return (
      <>
        <section className={cn('rounded-xl bg-surface p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]', className)}>
          <h3 className="text-body-lg font-bold text-on-surface">Delivery Address</h3>
          <p className="text-body-md mt-2 text-on-surface-variant">Add an address to continue checkout.</p>
          {allowEdit && !readOnly ? (
            <button
              type="button"
              onClick={openCreate}
              className="text-label-md mt-4 inline-flex rounded-full border border-primary px-6 py-2 font-bold text-primary transition-colors hover:bg-primary-fixed-dim"
            >
              Add address
            </button>
          ) : (
            <Link
              to="/buyer/addresses"
              className="text-label-md mt-4 inline-flex rounded-full border border-primary px-6 py-2 font-bold text-primary transition-colors hover:bg-primary-fixed-dim"
            >
              Add address
            </Link>
          )}
        </section>
        {allowEdit && !readOnly ? (
          <AddressFormModal
            open={formOpen}
            onClose={() => {
              if (saveMutation.isPending) return
              setFormOpen(false)
              setEditingAddress(null)
              setFormError(null)
            }}
            initial={editingAddress}
            saving={saveMutation.isPending}
            error={formError}
            onSubmit={(payload) => saveMutation.mutate(payload)}
          />
        ) : null}
      </>
    )
  }

  if (!selected) return null

  return (
    <>
      <section className={cn('space-y-3', className)}>
        <div className="flex items-start justify-between gap-4 rounded-xl border-l-4 border-primary bg-surface p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] lg:p-6">
          <div className="flex min-w-0 gap-4">
            <span
              className="material-symbols-outlined mt-1 shrink-0 text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {addressLabelIcon(selected.label).icon}
            </span>
            <div className="min-w-0">
              <h3 className="text-body-lg font-bold text-on-surface">Delivery Address</h3>
              <p className="text-body-md mt-1 font-bold text-on-surface">{selected.label ?? 'Address'}</p>
              <p className="text-body-md text-on-surface-variant">
                {formatBuyerAddressLines(selected).map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
          {!readOnly ? (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              {allowEdit ? (
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="text-label-md rounded-full border border-outline-variant px-5 py-2 font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  Edit
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setPickerOpen((open) => !open)}
                className="text-label-md rounded-full border border-primary px-5 py-2 font-bold text-primary transition-colors hover:bg-primary-fixed-dim"
              >
                {pickerOpen ? 'Done' : 'Change'}
              </button>
            </div>
          ) : null}
        </div>

        {pickerOpen && !readOnly ? (
          <div className="space-y-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-sm">
            {addresses.map((addr) => (
              <button
                key={addr.uuid}
                type="button"
                onClick={() => {
                  onSelect(addr.uuid)
                  setPickerOpen(false)
                }}
                className={cn(
                  'flex w-full rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-container-low',
                  addr.uuid === selectedUuid && 'border border-primary/30 bg-primary-fixed/10',
                )}
              >
                <p className="text-body-md font-bold text-on-surface">{addr.label ?? 'Address'}</p>
                <p className="text-body-md text-on-surface-variant">{formatBuyerAddressLines(addr).join(', ')}</p>
              </button>
            ))}
            <div className="flex flex-wrap gap-3 px-4 py-2">
              {allowEdit ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="text-label-md font-bold text-primary hover:underline"
                >
                  Add new address
                </button>
              ) : null}
              <Link to="/buyer/addresses" className="text-label-md font-bold text-primary hover:underline">
                Manage addresses
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {allowEdit && !readOnly ? (
        <AddressFormModal
          open={formOpen}
          onClose={() => {
            if (saveMutation.isPending) return
            setFormOpen(false)
            setEditingAddress(null)
            setFormError(null)
          }}
          initial={editingAddress}
          saving={saveMutation.isPending}
          error={formError}
          onSubmit={(payload) => saveMutation.mutate(payload)}
        />
      ) : null}
    </>
  )
}
