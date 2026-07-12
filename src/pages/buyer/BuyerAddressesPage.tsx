import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerAddress, BuyerAddressPayload } from '@/api/services/buyerService'
import { AddressFormModal } from '@/components/buyer/AddressFormModal'
import { ConfirmActionModal } from '@/components/buyer/ConfirmActionModal'
import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { RemoteImage } from '@/components/buyer/ProductImage'
import {
  addressLabelIcon,
  formatAddressDisplay,
  useAddressDeliveryQuote,
} from '@/utils/buyerAccount'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

const EXPRESS_MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCj-wg8fqmJ1QMdZNXjjNyU_pPdynNvmQVCtz6ACrtrCZjo1tNE_iiRPsZvrU_V1g-OcVfNoN1zIPxAFxpIIXVMafYYS6YPkcz5Vr3X2iIf8v7KzSyY8IrXmPOOwypYVTQPTsvtQMAUbXV1ELy5RZHsUiF03XD0glI0ztmn3PIUkdaf5FbKmV2YNy0Kg7RzCiCg-wzHOdKnSp_vGQgvNH1nvCKunUKdIHMaPZC_KmlvIPZeoOZFWzzcFXlGGYWKI2M6KwH2pBUAAiLE'

function AddressCard({
  address,
  canQuote,
  onEdit,
  onDelete,
  onSetDefault,
  deleting,
  settingDefault,
}: {
  address: BuyerAddress
  canQuote: boolean
  onEdit: (address: BuyerAddress) => void
  onDelete: (address: BuyerAddress) => void
  onSetDefault: (uuid: string) => void
  deleting: boolean
  settingDefault: boolean
}) {
  const { icon, wrap } = addressLabelIcon(address.label)
  const { est, fee } = useAddressDeliveryQuote(address, canQuote)
  const display = formatAddressDisplay(address)

  return (
    <article className="stitch-bento-card stitch-card-shadow relative rounded-2xl border-0 bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:flex lg:flex-col lg:rounded-[inherit] lg:border lg:border-surface-container-high lg:p-8 lg:shadow-none">
      {address.is_default ? (
        <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={settingDefault}
          onClick={() => onSetDefault(address.uuid)}
          className="absolute top-3 right-3 text-outline transition-colors hover:text-primary disabled:opacity-50 lg:top-4 lg:right-4"
          title="Set as default"
        >
          <span className="material-symbols-outlined">star</span>
        </button>
      )}

      <div className="mb-3 flex items-center gap-3 pr-8 lg:mb-4 lg:gap-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full lg:h-12 lg:w-12 lg:rounded-xl', wrap)}>
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <h5 className="truncate text-[15px] font-bold text-on-surface lg:text-headline-lg">
            {address.label ?? 'Address'}
          </h5>
          {address.is_default ? (
            <span className="text-[10px] font-bold tracking-wide text-primary uppercase lg:text-label-md lg:rounded lg:bg-primary-fixed-dim/20 lg:px-2 lg:py-0.5 lg:normal-case">
              Default
            </span>
          ) : null}
        </div>
      </div>

      <p className="mb-3 text-sm leading-snug text-on-surface-variant lg:mb-6 lg:flex-1 lg:text-body-md">
        {display}
      </p>

      <div className="mb-3 space-y-1.5 rounded-xl bg-surface-container-low/80 px-3 py-2.5 lg:mb-6 lg:space-y-2 lg:bg-transparent lg:p-0">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            Est.
          </span>
          <span className="font-bold text-primary">{est}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[16px]">delivery_dining</span>
            Fee
          </span>
          <span className="font-bold text-on-surface">{fee}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-outline-variant/50 pt-3 lg:pt-4">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-fixed-dim/10 lg:text-label-md lg:uppercase lg:tracking-wider"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(address)}
          className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error-container/50 disabled:opacity-50 lg:text-label-md lg:uppercase lg:tracking-wider"
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export function BuyerAddressesPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<BuyerAddress | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BuyerAddress | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'addresses'],
    queryFn: () => buyerService.listAddresses(),
  })

  const { data: cartData } = useQuery({
    queryKey: ['buyer', 'cart'],
    queryFn: () => buyerService.getCart(),
  })

  const canQuote = useMemo(() => (cartData?.data?.items?.length ?? 0) > 0, [cartData?.data?.items])

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => buyerService.deleteAddress(uuid),
    onSuccess: () => {
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['buyer', 'addresses'] })
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (uuid: string) => buyerService.setDefaultAddress(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buyer', 'addresses'] }),
  })

  const saveMutation = useMutation({
    mutationFn: (payload: BuyerAddressPayload) => {
      if (editingAddress) {
        return buyerService.updateAddress(editingAddress.uuid, payload)
      }
      return buyerService.createAddress(payload)
    },
    onSuccess: () => {
      setFormOpen(false)
      setEditingAddress(null)
      setFormError(null)
      queryClient.invalidateQueries({ queryKey: ['buyer', 'addresses'] })
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Failed to save address')),
  })

  const addresses = data?.data ?? []

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

  return (
    <BuyerAccountShell
      title="Addresses"
      right={
        <button
          type="button"
          onClick={openCreate}
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-low lg:hidden"
          aria-label="Add new address"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
      }
    >
      <div className="mb-2 hidden flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8 lg:flex">
        <div>
          <h1 className="text-headline-xl text-on-surface">Your Addresses</h1>
          <p className="text-body-lg text-on-surface-variant">
            Where should we deliver your organic harvest?
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="text-label-md flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-md transition-all hover:brightness-110 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Address
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load addresses')}
        </p>
      ) : null}

      {deleteMutation.isError ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(deleteMutation.error, 'Failed to delete address')}
        </p>
      ) : null}

      {setDefaultMutation.isError ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(setDefaultMutation.error, 'Failed to update default address')}
        </p>
      ) : null}

      <section className="stitch-bento-card mb-8 hidden flex-col items-center gap-6 overflow-hidden border border-primary-fixed-dim bg-gradient-to-r from-primary-fixed to-surface-bright p-6 lg:mb-10 lg:flex lg:flex-row lg:gap-8 lg:p-8">
        <div className="z-10 flex-1">
          <div className="text-label-md mb-4 inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-on-primary-container">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            EXPRESS DELIVERY
          </div>
          <h2 className="text-headline-xl mb-2 text-on-primary-fixed">Fast Delivery Guarantee</h2>
          <p className="text-body-lg mb-6 max-w-lg text-on-primary-fixed-variant">
            We guarantee delivery within 45 minutes of harvest processing, or your delivery fee is on
            us. Serving premium freshness to your doorstep.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/60 px-4 py-2 backdrop-blur-md">
              <span className="material-symbols-outlined text-primary">timer</span>
              <span className="text-body-md font-bold text-primary">Avg. 18 Mins</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/60 px-4 py-2 backdrop-blur-md">
              <span className="material-symbols-outlined text-primary">verified</span>
              <span className="text-body-md font-bold text-primary">Certified Routes</span>
            </div>
          </div>
        </div>
        <div className="relative flex aspect-square w-full max-w-xs items-center justify-center lg:w-1/3">
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative h-full w-full rotate-3 overflow-hidden rounded-2xl shadow-2xl transition-transform duration-500 hover:rotate-0">
            <RemoteImage src={EXPRESS_MAP_IMAGE} alt="" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-6 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container lg:h-72 lg:rounded-3xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-14 text-center shadow-[0_2px_12px_rgba(15,40,20,0.06)]">
          <span className="material-symbols-outlined mb-2 text-4xl text-outline">location_off</span>
          <p className="text-sm text-on-surface-variant">No addresses saved yet.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 text-sm font-bold text-primary lg:hidden"
          >
            Add an address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.uuid}
              address={addr}
              canQuote={canQuote}
              deleting={deleteMutation.isPending}
              settingDefault={setDefaultMutation.isPending}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onSetDefault={(uuid) => setDefaultMutation.mutate(uuid)}
            />
          ))}
        </div>
      )}

      <ConfirmActionModal
        open={!!deleteTarget}
        confirming={deleteMutation.isPending}
        onClose={() => {
          if (deleteMutation.isPending) return
          setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.uuid)
        }}
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold text-primary">
              &apos;{deleteTarget?.label ?? 'this address'}&apos;
            </span>
            ?
          </>
        }
        description="This action cannot be undone."
      />

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
    </BuyerAccountShell>
  )
}
