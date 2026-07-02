import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOtpStore } from '@/store/otpStore'
import type { OtpRole } from '@/api/services/authService'
import { APP_NAME } from '@/constants/app'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
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
        setFormError(getApiErrorMessage(err, 'OTP verification failed'))
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
      setFormError(getApiErrorMessage(err, 'Failed to resend OTP'))
    }
  }

  return (
    <div className="stitch-auth-page stitch-body stitch-otp-bg relative flex min-h-dvh flex-col text-on-background">
      <div className="pointer-events-none absolute inset-0 bg-white/20" aria-hidden />

      <header className="sticky top-0 z-10 flex h-16 w-full items-center border-b border-white/20 bg-white/40 px-margin-mobile backdrop-blur-md">
        <Link
          to={backPath}
          className="-ml-2 p-2 transition-transform duration-150 active:scale-95"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </Link>
        <h1 className="text-headline-lg-mobile ml-4 tracking-tight text-primary">{APP_NAME}</h1>
      </header>

      <main className="relative z-10 flex grow flex-col items-center justify-center px-margin-mobile py-8">
        <div className="stitch-glass-card-otp flex w-full max-w-md flex-col items-center rounded-[32px] p-8 shadow-2xl">
          <div className="mb-10 w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span
                  className="material-symbols-outlined text-5xl text-primary"
                  style={{ fontVariationSettings: "'wght' 200, 'FILL' 1" }}
                >
                  domain_verification
                </span>
              </div>
            </div>
            <h2 className="text-headline-xl mb-2 tracking-tight text-on-surface">Verify OTP</h2>
            <p className="text-body-md text-on-surface-variant">We&apos;ve sent a 6-digit code to</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-on-surface">+91 {phone}</span>
              <Link
                to={backPath}
                className="text-label-md rounded-full bg-primary/10 px-3 py-1 text-primary transition-all hover:bg-primary/20 active:scale-95"
              >
                Edit
              </Link>
            </div>
          </div>

          <form className="flex w-full flex-col gap-6" onSubmit={(e) => void onVerify(e)}>
            <div>
              <div className="flex justify-center gap-3">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    pattern="\d*"
                    required
                    value={digit}
                    disabled={status !== 'idle'}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(-1)
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
                    className="stitch-otp-input text-headline-lg-mobile h-16 w-12 rounded-lg border border-white/50 bg-white/50 text-center shadow-sm transition-all focus:bg-white"
                  />
                ))}
              </div>
              <div className="mt-2 text-center">
                <span className="text-label-md text-on-surface-variant opacity-60">{otp.length}/6</span>
              </div>
            </div>

            {formError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status !== 'idle' || otp.length !== 6}
              className={cn(
                'flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl font-bold shadow-lg transition-all duration-200 active:scale-[0.98]',
                status === 'success'
                  ? 'bg-tertiary-container text-on-tertiary-container shadow-none'
                  : 'bg-gradient-to-br from-primary to-primary/80 text-on-primary shadow-primary/30',
                status === 'verifying' && 'cursor-not-allowed opacity-90',
              )}
            >
              {status === 'verifying' ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Verifying...
                </span>
              ) : status === 'success' ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined stitch-success-checkmark">check_circle</span>
                  Success
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Verify &amp; Proceed
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-12 w-full text-center">
            <div className="inline-block w-full rounded-2xl border border-white/20 bg-white/30 px-6 py-4">
              {resendSeconds > 0 ? (
                <p className="text-body-md text-on-surface-variant">
                  Didn&apos;t receive the code?{' '}
                  <span className="mt-1 block text-base font-bold text-secondary opacity-80">
                    Resend in 00:{String(resendSeconds).padStart(2, '0')}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void resend()}
                  className="py-1 text-base font-bold text-secondary transition-all hover:underline active:scale-95"
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
