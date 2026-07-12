import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerAddress, BuyerAddressPayload } from '@/api/services/buyerService'
import { AddressFormModal } from '@/components/buyer/AddressFormModal'
import { addressLabelIcon, formatBuyerAddressLines } from '@/utils/buyerAddress'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

export type CheckoutDeliveryAddressHandle = {
  requireAddress: () => void
}

export const CheckoutDeliveryAddress = forwardRef<
  CheckoutDeliveryAddressHandle,
  {
    addresses: BuyerAddress[]
    selectedUuid: string | null
    onSelect: (uuid: string) => void
    allowEdit?: boolean
    readOnly?: boolean
    className?: string
  }
>(function CheckoutDeliveryAddress(
  {
    addresses,
    selectedUuid,
    onSelect,
    allowEdit = true,
    readOnly = false,
    className,
  },
  ref,
) {
  const queryClient = useQueryClient()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<BuyerAddress | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [needsAddress, setNeedsAddress] = useState(false)

  const selected = addresses.find((a) => a.uuid === selectedUuid) ?? null

  useEffect(() => {
    if (selected) setNeedsAddress(false)
  }, [selected])

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
      setNeedsAddress(false)
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

  useImperativeHandle(ref, () => ({
    requireAddress: () => {
      setNeedsAddress(true)
      if (allowEdit && !readOnly) {
        if (addresses.length === 0 || !selected) {
          openCreate()
        } else {
          setPickerOpen(true)
        }
      }
    },
  }))

  const softCard =
    'rounded-2xl bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:p-5 lg:shadow-none'

  if (addresses.length === 0) {
    return (
      <>
        <section
          id="checkout-delivery-address"
          className={cn(
            softCard,
            needsAddress && 'ring-2 ring-error/70 ring-offset-2 ring-offset-surface',
            className,
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                needsAddress ? 'bg-error-container text-error' : 'bg-primary/10 text-primary',
              )}
            >
              <span className="material-symbols-outlined text-[22px]">location_on</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-on-surface lg:text-base">Delivery address</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                {needsAddress
                  ? 'Add a delivery address to continue to payment.'
                  : 'Add an address to continue checkout.'}
              </p>
              {allowEdit && !readOnly ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary transition-transform active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add address
                </button>
              ) : (
                <Link
                  to="/buyer/addresses"
                  className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add address
                </Link>
              )}
            </div>
          </div>
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

  return (
    <>
      <section
        id="checkout-delivery-address"
        className={cn(
          'space-y-2.5',
          needsAddress && !selected && 'rounded-2xl ring-2 ring-error/70 ring-offset-2 ring-offset-surface',
          className,
        )}
      >
        {selected ? (
          <div className={cn(softCard, 'flex items-start gap-3')}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {addressLabelIcon(selected.label).icon}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-outline uppercase">
                    Delivering to
                  </p>
                  <h3 className="mt-0.5 text-[15px] font-bold text-on-surface lg:text-base">
                    {selected.label ?? 'Address'}
                  </h3>
                </div>
                {!readOnly ? (
                  <div className="flex shrink-0 gap-1.5">
                    {allowEdit ? (
                      <button
                        type="button"
                        onClick={() => openEdit(selected)}
                        className="rounded-full px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors active:bg-surface-container-low"
                      >
                        Edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPickerOpen((open) => !open)}
                      className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
                    >
                      {pickerOpen ? 'Done' : 'Change'}
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-snug text-on-surface-variant">
                {formatBuyerAddressLines(selected).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className={cn(softCard, needsAddress && 'bg-error-container/20')}>
            <p className="text-sm font-semibold text-on-surface">
              {needsAddress ? 'Choose a delivery address to continue.' : 'Select a delivery address'}
            </p>
            <button
              type="button"
              onClick={() => {
                setPickerOpen(true)
                if (allowEdit) openCreate()
              }}
              className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add_location</span>
              {allowEdit ? 'Add or select address' : 'Select address'}
            </button>
          </div>
        )}

        {(pickerOpen || !selected) && !readOnly ? (
          <div className="space-y-1.5 rounded-2xl bg-surface-container-lowest p-2 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:rounded-xl lg:border lg:border-outline-variant/30 lg:shadow-none">
            {addresses.map((addr) => (
              <button
                key={addr.uuid}
                type="button"
                onClick={() => {
                  onSelect(addr.uuid)
                  setPickerOpen(false)
                  setNeedsAddress(false)
                }}
                className={cn(
                  'flex w-full flex-col rounded-xl px-3.5 py-3 text-left transition-colors active:bg-surface-container-low',
                  addr.uuid === selectedUuid && 'bg-primary/8 ring-1 ring-primary/25',
                )}
              >
                <p className="text-sm font-bold text-on-surface">{addr.label ?? 'Address'}</p>
                <p className="text-xs text-on-surface-variant">
                  {formatBuyerAddressLines(addr).join(', ')}
                </p>
              </button>
            ))}
            <div className="flex flex-wrap gap-3 px-3 py-2">
              {allowEdit ? (
                <button type="button" onClick={openCreate} className="text-sm font-bold text-primary">
                  Add new address
                </button>
              ) : null}
              <Link to="/buyer/addresses" className="text-sm font-bold text-primary">
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
})
