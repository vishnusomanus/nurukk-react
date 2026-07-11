import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
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

  const ready = phone.length === 10
  const defaultSub =
    mode === 'register'
      ? 'Create your account with a one-time code.'
      : 'Sign in with your mobile number.'

  return (
    <div className="stitch-auth-page stitch-login stitch-login-bg relative flex min-h-dvh flex-col overflow-x-clip">
      <div className="stitch-login-overlay pointer-events-none absolute inset-0" aria-hidden />

      <main className="safe-pt safe-pb relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        <header className="stitch-login-enter flex flex-1 flex-col items-center justify-end pb-10 text-center">
          <BrandLogo role={role} size="lg" className="stitch-login-logo mb-5 drop-shadow-sm" />
          <h1 className="stitch-login-brand mb-3 text-primary">{headline ?? APP_NAME}</h1>
          <p className="max-w-[16rem] text-[15px] leading-snug text-on-surface-variant/90">
            {subheadline ?? defaultSub}
          </p>
        </header>

        <section
          className="stitch-login-enter stitch-login-enter-delay pb-4"
          style={{ animationDelay: '80ms' }}
        >
          {roleChoice ? (
            <div className="mb-5 grid gap-2">
              {roleChoice.options.map((option) => {
                const selected = roleChoice.value === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => roleChoice.onChange(option.value)}
                    className={cn(
                      'rounded-2xl px-4 py-3 text-left transition-colors',
                      selected
                        ? 'bg-primary text-on-primary'
                        : 'bg-white/70 text-on-surface ring-1 ring-primary/10 backdrop-blur-sm',
                    )}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    {option.description ? (
                      <p
                        className={cn(
                          'mt-0.5 text-xs',
                          selected ? 'text-on-primary/80' : 'text-on-surface-variant',
                        )}
                      >
                        {option.description}
                      </p>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}

          <label className="sr-only" htmlFor="mobile-number">
            Mobile number
          </label>
          <div
            className={cn(
              'stitch-login-field flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3.5 shadow-[0_12px_40px_-18px_rgba(13,99,27,0.35)] ring-1 ring-primary/10 backdrop-blur-md transition-[box-shadow,ring-color] duration-300',
              inputError && 'ring-2 ring-rose-400',
              ready && !inputError && 'ring-2 ring-primary/35',
            )}
          >
            <span className="shrink-0 text-sm font-semibold tracking-wide text-primary">+91</span>
            <span className="h-5 w-px bg-primary/15" aria-hidden />
            <input
              id="mobile-number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(v)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onSubmit()
              }}
              className="min-w-0 flex-1 border-none bg-transparent text-lg font-semibold tracking-[0.12em] text-on-surface placeholder:tracking-normal placeholder:font-medium placeholder:text-on-surface-variant/40 focus:ring-0 focus:outline-none"
            />
          </div>

          {formError ? (
            <p className="mt-3 text-center text-sm text-rose-700" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="button"
            disabled={isSending}
            onClick={() => void onSubmit()}
            className={cn(
              'stitch-login-cta group mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-on-primary transition-[transform,opacity,box-shadow] duration-200',
              ready ? 'opacity-100' : 'opacity-90',
            )}
          >
            {isSending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
                Sending…
              </>
            ) : (
              <>
                Send OTP
                <span className="material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:translate-x-0.5">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </section>

        <footer
          className="stitch-login-enter mt-auto flex flex-col items-center gap-3 pb-8 pt-8 text-center"
          style={{ animationDelay: '140ms' }}
        >
          {extraFooter}
          {!roleChoice ? (
            <p className="text-xs text-on-surface-variant/70">
              By continuing, you agree to our{' '}
              <a className="font-semibold text-primary/90 underline-offset-2 hover:underline" href="#">
                Terms
              </a>{' '}
              &amp;{' '}
              <a className="font-semibold text-primary/90 underline-offset-2 hover:underline" href="#">
                Privacy
              </a>
            </p>
          ) : (
            <p className="text-xs text-on-surface-variant/70">
              <Link to="/" className="font-semibold text-primary hover:opacity-80">
                Back to home
              </Link>
            </p>
          )}
          <p className="text-[10px] tracking-[0.18em] text-on-surface-variant/35 uppercase">
            {appCopyright()}
          </p>
        </footer>
      </main>
    </div>
  )
}
