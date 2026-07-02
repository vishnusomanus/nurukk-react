import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOtpStore } from '@/store/otpStore'
import type { OtpRole } from '@/api/services/authService'
import { APP_NAME, appCopyright } from '@/constants/app'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'
import type { OtpNavigationState } from '@/utils/otpNavigation'

type RoleChoiceOption = {
  value: OtpRole
  label: string
  description?: string
}

export function PremiumLoginTemplate({
  role,
  mode,
  extraFooter,
  headline,
  subheadline,
  roleChoice,
}: {
  role: OtpRole
  mode: 'login' | 'register'
  extraFooter?: ReactNode
  headline?: string
  subheadline?: string
  roleChoice?: {
    value: OtpRole
    options: RoleChoiceOption[]
    onChange: (value: OtpRole) => void
  }
}) {
  const navigate = useNavigate()
  const requestOtp = useAuth((s) => s.requestOtp)
  const setPending = useOtpStore((s) => s.setPending)

  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [inputError, setInputError] = useState(false)

  const onSubmit = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setInputError(true)
      window.setTimeout(() => setInputError(false), 800)
      return
    }

    setFormError(null)
    setIsSending(true)
    const otpSession: OtpNavigationState = { phone: digits, role, mode }
    try {
      await requestOtp({ phone: digits, role })
      setPending(otpSession)
      navigate('/otp', { replace: true, state: otpSession })
    } catch (e: unknown) {
      setFormError(getApiErrorMessage(e, 'Failed to send OTP'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="stitch-auth-page stitch-body stitch-login-bg relative flex min-h-dvh flex-col items-center">
      <div className="stitch-login-overlay pointer-events-none fixed inset-0" aria-hidden />

      <main className="relative z-10 flex w-full max-w-md flex-1 flex-col px-margin-mobile pt-12 pb-16">
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="group relative mb-6">
            <div className="absolute inset-0 scale-110 rounded-3xl bg-white/20 blur-xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/50 bg-white/40 shadow-sm backdrop-blur-md transition-transform duration-500 hover:scale-105">
              <span className="material-symbols-outlined filled text-[48px] text-primary">eco</span>
            </div>
          </div>
          <h1 className="text-headline-xl mb-2 tracking-tight text-primary">{headline ?? APP_NAME}</h1>
          <p className="text-body-lg max-w-[280px] font-medium leading-relaxed text-on-surface-variant">
            {subheadline ?? 'Premium organic produce from farm to your kitchen table.'}
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <div className="stitch-glass-card rounded-[2rem] p-6">
            {roleChoice ? (
              <div className="mb-6 space-y-3">
                <p className="text-label-md tracking-widest text-on-surface-variant opacity-80">
                  DELIVERY ROLE
                </p>
                <div className="grid gap-2">
                  {roleChoice.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => roleChoice.onChange(option.value)}
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-left transition-all',
                        roleChoice.value === option.value
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-primary/10 bg-white/40 hover:border-primary/30',
                      )}
                    >
                      <p className="text-body-md font-bold text-on-surface">{option.label}</p>
                      {option.description ? (
                        <p className="text-body-md mt-0.5 text-on-surface-variant">{option.description}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mb-6 space-y-3">
              <label
                className="text-label-md mb-3 flex items-center gap-2 tracking-widest text-on-surface-variant opacity-80"
                htmlFor="mobile-number"
              >
                <span className="material-symbols-outlined text-sm">phone_iphone</span>
                MOBILE NUMBER
              </label>
              <div
                className={cn(
                  'stitch-input-premium flex items-center border-b-2 border-primary/10 bg-white/40 px-2 py-4 transition-all duration-300',
                  inputError && 'border-red-500/50',
                )}
              >
                <div className="flex items-center gap-2 border-r border-primary/10 pr-4 font-bold text-on-surface">
                  <span className="font-bold text-primary">+91</span>
                </div>
                <input
                  id="mobile-number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="00000 00000"
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setPhone(v)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void onSubmit()
                  }}
                  className="text-headline-lg-mobile ml-4 w-full border-none bg-transparent tracking-[0.1em] text-on-surface placeholder:font-normal placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {formError ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {formError}
              </div>
            ) : null}

            <button
              type="button"
              disabled={isSending}
              onClick={() => void onSubmit()}
              className={cn(
                'stitch-btn-premium group relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl text-headline-lg-mobile text-on-primary transition-all duration-300',
                phone.length === 10 && 'ring-4 ring-primary/20',
              )}
            >
              {isSending ? (
                <>
                  <span className="material-symbols-outlined relative z-10 animate-spin">sync</span>
                  <span className="relative z-10 ml-2 font-bold tracking-wide">Verifying...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10 font-bold tracking-wide">Send OTP</span>
                  <span className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex w-full max-w-md flex-col gap-3 px-margin-mobile pb-8 text-center">
        {extraFooter}
        {!roleChoice ? (
          <p className="text-body-md font-medium text-on-surface-variant/80">By continuing, you agree to our</p>
        ) : (
          <p className="text-body-md text-on-surface-variant/80">
            <Link to="/" className="font-semibold text-primary hover:opacity-80">
              Back to home
            </Link>
          </p>
        )}
        <div className="flex items-center justify-center gap-4">
          <a className="text-label-md font-bold text-primary transition-opacity hover:opacity-70" href="#">
            Terms &amp; Conditions
          </a>
          <span className="h-1 w-1 rounded-full bg-primary/20" />
          <a className="text-label-md font-bold text-primary transition-opacity hover:opacity-70" href="#">
            Privacy Policy
          </a>
        </div>
        <p className="text-label-md mt-2 tracking-[0.2em] text-on-surface-variant/40 uppercase">
          {appCopyright()}
        </p>
      </footer>
    </div>
  )
}
