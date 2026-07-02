import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

const PROFILE_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ9ckQZn0lT5D3bSUX7eM8UtAlvBN8BWRmE4txSfmfWbN5VWLGAdP1rLHT05BCuyrFoN6ITty1b7PxWBtWAyhoLQDY5oW3oaGwFCAPwFvxCPEu_479oV-od-Rykpnv1jdy7vMg8K68bFo_MQTZYu1KyYWCItZuvFgJGZecsQW5CjptmF7HjoT-kFIrSDJHTrI7Ck47VL5jSew4JjX45zM5VfZ43C5U_K6Cf3NS5R5SNziw4v7ZslCtnX7x_ylXuplppY7JHDr-yXPZ'

function formatPhoneDisplay(phone?: string | null): string {
  const digits = String(phone ?? '').replace(/\D/g, '')
  const local = digits.length > 10 ? digits.slice(-10) : digits
  if (local.length !== 10) return phone ?? '—'
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
}

function sellerStatusLabel(status?: string): { label: string; verified: boolean } {
  switch (status) {
    case 'approved':
      return { label: 'Verified Farmer', verified: true }
    case 'pending':
      return { label: 'Pending Verification', verified: false }
    case 'rejected':
      return { label: 'Verification Rejected', verified: false }
    default:
      return { label: 'Seller Account', verified: false }
  }
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-md tracking-wider text-on-surface-variant uppercase">{label}</span>
      <p className="text-body-lg font-semibold text-on-surface">{value?.trim() || '—'}</p>
    </div>
  )
}

export function SellerProfilePage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => sellerService.getProfile(),
  })

  const { data: salesData } = useQuery({
    queryKey: ['seller', 'reports', 'month'],
    queryFn: () => sellerService.getSalesReport('month'),
  })

  const profile = data?.data
  const displayName = user?.name ?? 'Seller'
  const status = sellerStatusLabel(profile?.status)
  const location = [profile?.city, profile?.pincode].filter(Boolean).join(', ')
  const earnings = salesData?.data?.total_sales ?? 0

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <p className="text-body-md text-on-surface-variant">Loading profile…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load profile')}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-8">
      <nav className="text-label-md flex items-center gap-2 text-on-surface-variant">
        <span>Settings</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-bold text-primary">Personal Information</span>
      </nav>

      <section className="stitch-card-shadow relative overflow-hidden rounded-xl border border-outline-variant/30 bg-white">
        <div className="relative h-32 w-full bg-gradient-to-r from-primary to-tertiary-container opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-end justify-between gap-4 px-6 pb-6 md:flex-row md:items-center">
          <div className="-mt-12 flex flex-col items-end gap-4 md:flex-row md:items-center">
            <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-surface shadow-md">
              <RemoteImage src={PROFILE_AVATAR} alt={displayName} className="h-full w-full object-cover" />
            </div>
            <div className="mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-headline-xl text-on-surface">{displayName}</h1>
                {status.verified ? (
                  <span className="text-label-md flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-0.5 text-on-primary-fixed">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    {status.label}
                  </span>
                ) : (
                  <span className="text-label-md rounded-full bg-surface-container-high px-3 py-0.5 text-on-surface-variant">
                    {status.label}
                  </span>
                )}
              </div>
              <p className="text-body-md text-on-surface-variant">
                {profile?.name ? `${profile.name}` : 'Farm seller'}
                {location ? ` • ${location}` : ''}
              </p>
            </div>
          </div>
          <Link
            to="/seller/profile/edit"
            className="text-body-md flex items-center gap-2 rounded-full bg-surface-container-high px-6 py-2 font-bold text-primary transition-colors hover:bg-outline-variant/40 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">edit</span>
            Edit Profile
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <div className="flex flex-col gap-6 md:col-span-2">
          <section className="stitch-card-shadow rounded-xl border border-outline-variant/30 bg-white p-6">
            <h2 className="text-headline-lg mb-6 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">person</span>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoField label="Full Name" value={displayName} />
              <InfoField label="Email Address" value={user?.email} />
              <InfoField label="Mobile Number" value={formatPhoneDisplay(profile?.phone ?? user?.phone)} />
            </div>
          </section>

          <section className="stitch-card-shadow rounded-xl border border-outline-variant/30 bg-white p-6">
            <h2 className="text-headline-lg mb-6 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">potted_plant</span>
              Business Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoField label="Farm Name" value={profile?.name} />
              <InfoField label="City" value={profile?.city} />
              <InfoField label="Pincode" value={profile?.pincode} />
              <InfoField label="Farm Address" value={profile?.address_line} />
            </div>
            {profile?.description ? (
              <div className="mt-6 flex flex-col gap-1">
                <span className="text-label-md tracking-wider text-on-surface-variant uppercase">About</span>
                <p className="text-body-lg text-on-surface">{profile.description}</p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div className="stitch-card-shadow relative overflow-hidden rounded-xl bg-primary p-6 text-on-primary shadow-lg">
            <div className="relative z-10">
              <h3 className="text-label-md mb-2 tracking-widest uppercase opacity-80">Earnings Overview</h3>
              <p className="text-headline-xl">{formatCurrency(earnings)}</p>
              <p className="text-body-md mt-1 opacity-90">Total sales this month</p>
              <Link
                to="/seller/orders"
                className="text-body-md mt-6 block w-full rounded-xl bg-on-primary py-2 text-center font-bold text-primary transition-transform active:scale-[0.98]"
              >
                View Orders
              </Link>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10">
              payments
            </span>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-secondary-container/20 bg-secondary-container/10 p-6">
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-secondary">lightbulb</span>
              <div>
                <h4 className="text-label-md font-bold text-secondary uppercase">Seller Tip</h4>
                <p className="text-body-md text-on-secondary-container">
                  Keep your farm description and city up to date so buyers can find local produce faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
