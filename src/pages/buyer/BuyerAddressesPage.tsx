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
    <article className="stitch-bento-card stitch-card-shadow relative flex flex-col border border-surface-container-high p-6 lg:p-8">
      {address.is_default ? (
        <div className="absolute top-4 right-4">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={settingDefault}
          onClick={() => onSetDefault(address.uuid)}
          className="absolute top-4 right-4 text-outline transition-colors hover:text-primary disabled:opacity-50"
          title="Set as default"
        >
          <span className="material-symbols-outlined">star</span>
        </button>
      )}

      <div className="mb-4 flex items-center gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', wrap)}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <div>
          <h5 className="text-headline-lg text-on-surface">{address.label ?? 'Address'}</h5>
          {address.is_default ? (
            <span className="text-label-md rounded bg-primary-fixed-dim/20 px-2 py-0.5 text-primary">
              Default
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-body-md mb-6 flex-1 text-on-surface-variant">{display}</p>

      <div className="mb-6 space-y-2">
        <div className="text-body-md flex items-center justify-between">
          <span className="text-outline flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            Delivery Est.
          </span>
          <span className="font-bold text-primary">{est}</span>
        </div>
        <div className="text-body-md flex items-center justify-between">
          <span className="text-outline flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">delivery_dining</span>
            Delivery Fee
          </span>
          <span className="font-bold text-on-surface">{fee}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-outline-variant pt-4">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="text-label-md flex-1 rounded-lg py-2 tracking-wider text-primary uppercase transition-colors hover:bg-primary-fixed-dim/10"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(address)}
          className="text-label-md flex-1 rounded-lg py-2 tracking-wider text-error uppercase transition-colors hover:bg-error-container/50 disabled:opacity-50"
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
    <BuyerAccountShell title="Addresses">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8">
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

      <section className="stitch-bento-card mb-8 flex flex-col items-center gap-6 overflow-hidden border border-primary-fixed-dim bg-gradient-to-r from-primary-fixed to-surface-bright p-6 lg:mb-10 lg:flex-row lg:gap-8 lg:p-8">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-surface-container" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <p className="py-16 text-center text-on-surface-variant">No addresses saved yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
