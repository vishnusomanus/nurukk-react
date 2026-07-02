import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'

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

function buildPhone(prefix: string, number: string) {
  const digits = number.replace(/\D/g, '')
  if (!digits) return null
  if (prefix === '+91') return `+91${digits}`
  return `${prefix}${digits}`
}

export function BuyerPersonalInfoPage() {
  const user = useAuthStore((s) => s.user)
  const initUser = useAuth((s) => s.initUser)
  const updateAuthProfile = useAuth((s) => s.updateProfile)

  const initialPhone = splitPhone(user?.phone)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phonePrefix] = useState(initialPhone.prefix)
  const [phone, setPhone] = useState(initialPhone.number)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    void initUser()
  }, [initUser])

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setPhone(splitPhone(user?.phone).number)
  }, [user])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAuthProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: buildPhone(phonePrefix, phone),
      }),
    onSuccess: () => {
      setSaveMessage('Profile updated successfully.')
      window.setTimeout(() => setSaveMessage(null), 2500)
    },
  })

  const handleDiscard = () => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setPhone(splitPhone(user?.phone).number)
    saveMutation.reset()
    setSaveMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  const errorMessage = saveMutation.isError
    ? getApiErrorMessage(saveMutation.error, 'Could not update profile')
    : null

  return (
    <BuyerAccountShell title="Personal Info">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-headline-xl text-on-surface">Personal Information</h1>
          <p className="text-body-lg text-on-surface-variant">
            Update your name, email, and contact details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-label-md text-on-surface-variant">
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-body-md h-12 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-email" className="text-label-md text-on-surface-variant">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-body-md h-12 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-phone" className="text-label-md text-on-surface-variant">
              Mobile number
            </label>
            <div className="flex items-center gap-3">
              <span className="text-body-md rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 font-bold text-primary">
                {phonePrefix}
              </span>
              <input
                id="profile-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="text-body-md h-12 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                placeholder="00000 00000"
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {errorMessage}
            </p>
          ) : null}
          {saveMessage ? (
            <p className="rounded-xl border border-primary/20 bg-primary-container/15 px-3 py-2 text-sm text-primary">
              {saveMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className={cn(
                'text-label-md rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-60',
              )}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saveMutation.isPending}
              className="text-label-md rounded-xl border border-outline-variant px-6 py-3 font-semibold text-on-surface-variant transition-all hover:bg-surface-container-low active:scale-95 disabled:opacity-60"
            >
              Discard
            </button>
          </div>
        </form>
      </div>
    </BuyerAccountShell>
  )
}
