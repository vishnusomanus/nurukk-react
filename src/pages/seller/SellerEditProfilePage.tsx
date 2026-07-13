import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sellerService from '@/api/services/sellerService'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { RemoteImage } from '@/components/buyer/ProductImage'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'
import { displayUserEmail, emailUpdatePayload } from '@/utils/userEmail'

const PROFILE_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ9ckQZn0lT5D3bSUX7eM8UtAlvBN8BWRmE4txSfmfWbN5VWLGAdP1rLHT05BCuyrFoN6ITty1b7PxWBtWAyhoLQDY5oW3oaGwFCAPwFvxCPEu_479oV-od-Rykpnv1jdy7vMg8K68bFo_MQTZYu1KyYWCItZuvFgJGZecsQW5CjptmF7HjoT-kFIrSDJHTrI7Ck47VL5jSew4JjX45zM5VfZ43C5U_K6Cf3NS5R5SNziw4v7ZslCtnX7x_ylXuplppY7JHDr-yXPZ'

function splitPhone(phone?: string | null) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length <= 10) {
    return { prefix: '+91', number: digits }
  }
  if (digits.startsWith('91') && digits.length > 10) {
    return { prefix: '+91', number: digits.slice(-10) }
  }
  return { prefix: '+91', number: digits }
}

function buildPhone(_prefix: string, number: string) {
  const digits = number.replace(/\D/g, '').slice(-10)
  return digits || null
}

export function SellerEditProfilePage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const initUser = useAuth((s) => s.initUser)
  const updateAuthProfile = useAuth((s) => s.updateProfile)

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => sellerService.getProfile(),
  })

  const profile = data?.data
  const initialPhone = splitPhone(profile?.phone ?? user?.phone)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(displayUserEmail(user?.email))
  const [phonePrefix] = useState(initialPhone.prefix)
  const [phone, setPhone] = useState(initialPhone.number)
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    void initUser()
  }, [initUser])

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(displayUserEmail(user?.email))
    setPhone(splitPhone(profile?.phone ?? user?.phone).number)
  }, [user, profile?.phone])

  useEffect(() => {
    if (!profile) return
    setStoreName(profile.name ?? '')
    setDescription(profile.description ?? '')
    setCity(profile.city ?? '')
    setPincode(profile.pincode ?? '')
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateAuthProfile({
        name: name.trim(),
        phone: buildPhone(phonePrefix, phone),
        ...emailUpdatePayload(email),
      })
      return sellerService.updateProfile({
        store_name: storeName.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        pincode: pincode.trim() || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] })
      setSaveMessage('Profile updated successfully.')
      window.setTimeout(() => setSaveMessage(null), 2500)
    },
  })

  const isDirty = useMemo(() => {
    const baselinePhone = splitPhone(profile?.phone ?? user?.phone).number
    return (
      name !== (user?.name ?? '') ||
      email !== displayUserEmail(user?.email) ||
      phone !== baselinePhone ||
      storeName !== (profile?.name ?? '') ||
      description !== (profile?.description ?? '') ||
      city !== (profile?.city ?? '') ||
      pincode !== (profile?.pincode ?? '')
    )
  }, [city, description, email, name, phone, pincode, profile, storeName, user])

  const handleDiscard = () => {
    setName(user?.name ?? '')
    setEmail(displayUserEmail(user?.email))
    setPhone(splitPhone(profile?.phone ?? user?.phone).number)
    setStoreName(profile?.name ?? '')
    setDescription(profile?.description ?? '')
    setCity(profile?.city ?? '')
    setPincode(profile?.pincode ?? '')
    saveMutation.reset()
    setSaveMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  if (isLoading) {
    return (
      <SellerPageShell pathname={location.pathname} ctaPad>
        <p className="text-sm text-on-surface-variant">Loading profile…</p>
      </SellerPageShell>
    )
  }

  if (error) {
    return (
      <SellerPageShell pathname={location.pathname} ctaPad>
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(error, 'Failed to load profile')}
        </p>
      </SellerPageShell>
    )
  }

  return (
    <SellerPageShell pathname={location.pathname} ctaPad className="space-y-4 lg:space-y-6">
      <nav className="hidden text-sm text-on-surface-variant lg:flex lg:items-center lg:gap-2">
        <Link to="/seller/profile" className="hover:text-primary">
          Profile
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-bold text-primary">Edit</span>
      </nav>

      <div className="hidden lg:block">
        <h1 className="text-headline-xl text-on-surface">Edit Profile</h1>
        <p className="text-body-md text-on-surface-variant">Update your account and farm details.</p>
      </div>

      {saveMutation.isError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {getApiErrorMessage(saveMutation.error, 'Failed to update profile')}
        </p>
      ) : null}

      {saveMessage ? (
        <p className="rounded-xl border border-primary/20 bg-primary-container/10 px-3 py-2 text-sm text-primary">
          {saveMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-8">
          <section className="stitch-card-shadow flex flex-col items-center gap-6 rounded-xl border border-outline-variant/30 bg-white p-6 sm:flex-row sm:items-start">
            <div className="group relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-surface-container shadow-md">
                <RemoteImage src={PROFILE_AVATAR} alt={name} className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                disabled
                title="Profile photo upload is not available yet"
                className="absolute right-0 bottom-0 flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border-2 border-white bg-primary text-on-primary opacity-70 shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>
            <div>
              <h3 className="text-headline-lg text-on-surface">Profile Picture</h3>
              <p className="text-body-md mb-2 text-on-surface-variant">PNG, JPG or GIF. Max 2MB.</p>
              <p className="text-body-md text-on-surface-variant">Photo upload will be available in a future release.</p>
            </div>
          </section>

          <form id="seller-profile-form" className="space-y-6" onSubmit={handleSubmit}>
            <section className="stitch-card-shadow rounded-xl border border-outline-variant/30 bg-white p-6">
              <h3 className="text-headline-lg mb-6 flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">person</span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-label-md px-1 text-on-surface-variant">Full Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-body-lg w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-label-md px-1 text-on-surface-variant">Email Address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-body-lg w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-label-md px-1 text-on-surface-variant">Mobile Number</span>
                  <div className="flex gap-2">
                    <span className="text-body-lg inline-flex items-center rounded-xl bg-surface-container-highest px-3 text-on-surface-variant">
                      {phonePrefix}
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="text-body-lg flex-1 rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className="stitch-card-shadow rounded-xl border border-outline-variant/30 bg-white p-6">
              <h3 className="text-headline-lg mb-6 flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">potted_plant</span>
                Business Information
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-label-md px-1 text-on-surface-variant">Farm Name</span>
                  <input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                    className="text-body-lg w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-label-md px-1 text-on-surface-variant">City</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-body-lg w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-label-md px-1 text-on-surface-variant">Pincode</span>
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-body-lg w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-label-md px-1 text-on-surface-variant">About Your Farm</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe your farm, produce, and growing practices…"
                    className="text-body-lg w-full resize-none rounded-xl border-none bg-surface-container-low px-4 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>
            </section>
          </form>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="stitch-bento-card group relative overflow-hidden rounded-3xl bg-secondary-container p-8 text-on-secondary-container shadow-lg">
            <div className="relative z-10">
              <p className="text-label-md mb-2 tracking-widest uppercase opacity-80">Your Farm</p>
              <h4 className="text-headline-xl mb-2">{storeName || 'Farm name'}</h4>
              <p className="text-body-md opacity-90">
                {[city, pincode].filter(Boolean).join(', ') || 'Add your location'}
              </p>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 rotate-12 text-[120px] opacity-10 transition-transform duration-500 group-hover:rotate-0">
              potted_plant
            </span>
          </div>

          <div className="stitch-card-shadow rounded-xl border border-outline-variant/30 bg-white p-6">
            <h3 className="text-label-md mb-4 tracking-wider text-on-surface-variant uppercase">Need help?</h3>
            <p className="text-body-md text-on-surface-variant">
              Farm address and delivery settings can be configured separately. Contact support if you need to update
              verification documents.
            </p>
            <Link
              to="/seller/profile"
              className="text-body-md mt-4 inline-flex items-center gap-1 font-bold text-primary hover:underline"
            >
              Back to profile
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="app-cta-safe fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/40 bg-surface/95 px-4 py-3 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-lg items-center gap-3 lg:max-w-none lg:justify-end">
          {isDirty ? (
            <button
              type="button"
              onClick={handleDiscard}
              className="h-12 shrink-0 rounded-xl border border-outline-variant px-5 text-sm font-bold text-on-surface-variant transition-colors active:bg-surface-container-low"
            >
              Discard
            </button>
          ) : null}
          <button
            type="submit"
            form="seller-profile-form"
            disabled={saveMutation.isPending || !isDirty}
            className={cn(
              'h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98] lg:max-w-xs lg:flex-none lg:px-8',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
            )}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </SellerPageShell>
  )
}
