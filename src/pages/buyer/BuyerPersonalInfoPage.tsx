import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BuyerAccountShell } from '@/components/buyer/BuyerAccountShell'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'
import { displayUserEmail, emailUpdatePayload } from '@/utils/userEmail'

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
  const [email, setEmail] = useState(displayUserEmail(user?.email))
  const [phonePrefix] = useState(initialPhone.prefix)
  const [phone, setPhone] = useState(initialPhone.number)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    void initUser()
  }, [initUser])

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(displayUserEmail(user?.email))
    setPhone(splitPhone(user?.phone).number)
  }, [user])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAuthProfile({
        name: name.trim(),
        phone: buildPhone(phonePrefix, phone),
        ...emailUpdatePayload(email),
      }),
    onSuccess: () => {
      setSaveMessage('Profile updated successfully.')
      window.setTimeout(() => setSaveMessage(null), 2500)
    },
  })

  const handleDiscard = () => {
    setName(user?.name ?? '')
    setEmail(displayUserEmail(user?.email))
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
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="mb-4 hidden lg:mb-8 lg:block">
          <h1 className="text-headline-xl text-on-surface">Personal Information</h1>
          <p className="text-body-lg text-on-surface-variant">
            Update your name, email, and contact details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-surface-container-lowest px-4 py-5 shadow-[0_2px_12px_rgba(15,40,20,0.06)] lg:space-y-6 lg:bg-transparent lg:p-0 lg:shadow-none"
        >
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-xs font-semibold text-on-surface-variant">
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none lg:bg-surface-container-lowest lg:text-base"
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="text-xs font-semibold text-on-surface-variant">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none lg:bg-surface-container-lowest lg:text-base"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-phone" className="text-xs font-semibold text-on-surface-variant">
              Mobile number
            </label>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-3 text-sm font-bold text-primary">
                {phonePrefix}
              </span>
              <input
                id="profile-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="h-12 min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface px-4 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none lg:bg-surface-container-lowest lg:text-base"
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

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className={cn(
                'flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 lg:flex-none lg:px-6',
              )}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saveMutation.isPending}
              className="rounded-xl border border-outline-variant px-4 py-3.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-low active:scale-[0.98] disabled:opacity-60 lg:px-6"
            >
              Discard
            </button>
          </div>
        </form>
      </div>
    </BuyerAccountShell>
  )
}
