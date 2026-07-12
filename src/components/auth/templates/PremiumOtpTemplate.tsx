import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAuth } from '@/hooks/useAuth'
import { useOtpStore } from '@/store/otpStore'
import type { OtpRole } from '@/api/services/authService'
import { APP_NAME } from '@/constants/app'
import { getApiMessage } from '@/utils/apiErrorMessage'
import { getHomePathForRole } from '@/utils/authRole'
import { getOtpBackPath } from '@/utils/authPaths'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

export function PremiumOtpTemplate({
  phone,
  role,
  mode,
}: {
  phone: string
  role: OtpRole
  mode: 'login' | 'register'
}) {
  const navigate = useNavigate()
  const clearPending = useOtpStore((s) => s.clearPending)
  const requestOtp = useAuth((s) => s.requestOtp)
  const verifyOtp = useAuth((s) => s.verifyOtp)

  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const submittingRef = useRef(false)
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [formError, setFormError] = useState<string | null>(null)
  const [resendSeconds, setResendSeconds] = useState(30)
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle')

  const backPath = getOtpBackPath({ mode, role })
  const otp = digits.join('')

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setInterval(() => setResendSeconds((s) => s - 1), 1000)
    return () => window.clearInterval(timer)
  }, [resendSeconds])

  const submitOtp = useCallback(
    async (code: string, e?: React.FormEvent) => {
      e?.preventDefault()
      if (code.length !== 6 || submittingRef.current) return

      submittingRef.current = true
      setFormError(null)
      setStatus('verifying')
      try {
        await verifyOtp({ phone, otp: code, role })
        setStatus('success')
        clearPending()
        window.setTimeout(() => {
          const loggedInUser = useAuthStore.getState().user
          if (mode === 'register' && role === 'seller') {
            navigate('/seller/onboarding', { replace: true })
            return
          }
          if (mode === 'register' && role === 'delivery_agent') {
            navigate('/delivery/onboarding', { replace: true })
            return
          }
          navigate(getHomePathForRole(loggedInUser?.role), { replace: true })
        }, 1000)
      } catch (err: unknown) {
        setStatus('idle')
        submittingRef.current = false
        setFormError(getApiMessage(err, 'Invalid OTP. Please try again.'))
        setDigits(Array(6).fill(''))
        window.setTimeout(() => inputsRef.current[0]?.focus(), 50)
      }
    },
    [phone, role, mode, verifyOtp, clearPending, navigate],
  )

  const maybeAutoSubmit = useCallback(
    (nextDigits: string[]) => {
      const code = nextDigits.join('')
      if (code.length === 6 && !nextDigits.includes('')) {
        void submitOtp(code)
      }
    },
    [submitOtp],
  )

  const onVerify = (e?: React.FormEvent) => void submitOtp(otp, e)

  const resend = async () => {
    if (resendSeconds > 0) return
    setFormError(null)
    try {
      await requestOtp({ phone, role })
      setResendSeconds(30)
      setDigits(Array(6).fill(''))
      inputsRef.current[0]?.focus()
    } catch (err: unknown) {
      setFormError(getApiMessage(err, 'Failed to resend OTP'))
    }
  }

  return (
    <div className="stitch-auth-page stitch-body stitch-otp-bg relative flex min-h-dvh flex-col overflow-x-clip text-on-background">
      <div className="pointer-events-none absolute inset-0 bg-white/20" aria-hidden />

      <header className="app-header-safe sticky top-0 z-10 w-full border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 sm:h-16 sm:px-margin-mobile">
          <Link
            to={backPath}
            className="-ml-1 shrink-0 p-2 transition-transform duration-150 active:scale-95"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <h1 className="ml-2 truncate text-lg font-bold tracking-tight text-primary sm:ml-4 sm:text-xl">
            {APP_NAME}
          </h1>
        </div>
      </header>

      <main className="safe-pb relative z-10 flex grow flex-col items-center justify-center overflow-y-auto px-3 py-5 scroll-touch sm:px-margin-mobile sm:py-8">
        <div className="stitch-glass-card-otp flex w-full max-w-md flex-col items-center rounded-2xl p-4 shadow-xl sm:rounded-[32px] sm:p-8 sm:shadow-2xl">
          <div className="mb-6 w-full text-center sm:mb-10">
            <div className="mb-4 flex justify-center sm:mb-6">
              <BrandLogo size="md" className="h-14 w-auto max-w-[140px] sm:h-20 sm:max-w-[180px]" />
            </div>
            <h2 className="mb-1 text-2xl font-bold tracking-tight text-on-surface sm:mb-2 sm:text-[32px] sm:leading-10">
              Verify OTP
            </h2>
            <p className="text-sm text-on-surface-variant">We&apos;ve sent a 6-digit code to</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="text-base font-bold tracking-wide text-on-surface sm:text-lg">
                +91 {phone}
              </span>
              <Link
                to={backPath}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-primary transition-all hover:bg-primary/20 active:scale-95 sm:px-3 sm:py-1 sm:text-xs"
              >
                Edit
              </Link>
            </div>
          </div>

          <form className="flex w-full flex-col gap-4 sm:gap-6" onSubmit={(e) => void onVerify(e)}>
            <div>
              <div
                className={cn(
                  'stitch-otp-row grid w-full grid-cols-6 gap-1.5 sm:gap-3',
                  formError && 'stitch-otp-shake',
                )}
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    pattern="\d*"
                    required
                    aria-invalid={formError ? true : undefined}
                    aria-describedby={formError ? 'otp-error' : undefined}
                    aria-label={`Digit ${index + 1}`}
                    value={digit}
                    disabled={status !== 'idle'}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(-1)
                      if (formError) setFormError(null)
                      const next = [...digits]
                      next[index] = v
                      setDigits(next)
                      if (v && index < 5) inputsRef.current[index + 1]?.focus()
                      maybeAutoSubmit(next)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        inputsRef.current[index - 1]?.focus()
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault()
                      if (formError) setFormError(null)
                      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                      if (!pasted) return
                      const next = Array(6).fill('')
                      pasted.split('').forEach((ch, i) => {
                        next[i] = ch
                      })
                      setDigits(next)
                      const focusIndex = Math.min(pasted.length, 5)
                      inputsRef.current[focusIndex]?.focus()
                      maybeAutoSubmit(next)
                    }}
                    className={cn(
                      'stitch-otp-input h-12 w-full min-w-0 rounded-lg border bg-white/50 text-center text-lg font-bold shadow-sm transition-all focus:bg-white sm:h-16 sm:rounded-lg sm:text-xl',
                      formError
                        ? 'stitch-otp-input--error border-error/60'
                        : 'border-white/50',
                    )}
                  />
                ))}
              </div>
              <div className="mt-2 text-center">
                <span className="text-[11px] font-semibold tracking-wide text-on-surface-variant opacity-60 sm:text-xs">
                  {otp.length}/6
                </span>
              </div>
            </div>

            {formError ? (
              <p
                id="otp-error"
                role="alert"
                aria-live="assertive"
                className="text-center text-sm font-semibold text-error"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status !== 'idle' || otp.length !== 6}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold shadow-lg transition-all duration-200 active:scale-[0.98] sm:h-14 sm:gap-3 sm:text-base',
                status === 'success'
                  ? 'bg-tertiary-container text-on-tertiary-container shadow-none'
                  : 'bg-gradient-to-br from-primary to-primary/80 text-on-primary shadow-primary/30',
                status === 'verifying' && 'cursor-not-allowed opacity-90',
              )}
            >
              {status === 'verifying' ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Verifying...
                </span>
              ) : status === 'success' ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined stitch-success-checkmark text-[20px]">
                    check_circle
                  </span>
                  Success
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Verify &amp; Proceed
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 w-full text-center sm:mt-12">
            <div className="inline-block w-full rounded-xl border border-white/20 bg-white/30 px-3 py-3 sm:rounded-2xl sm:px-6 sm:py-4">
              {resendSeconds > 0 ? (
                <p className="text-sm text-on-surface-variant">
                  Didn&apos;t receive the code?{' '}
                  <span className="mt-1 block text-sm font-bold text-secondary opacity-80 sm:text-base">
                    Resend in 00:{String(resendSeconds).padStart(2, '0')}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void resend()}
                  className="py-1 text-sm font-bold text-secondary transition-all hover:underline active:scale-95 sm:text-base"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
