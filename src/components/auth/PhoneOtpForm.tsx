import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthError, PremiumButton } from '@/components/auth/AuthShell'
import { useAuth } from '@/hooks/useAuth'
import { useOtpStore } from '@/store/otpStore'
import type { OtpRole } from '@/api/services/authService'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import type { OtpNavigationState } from '@/utils/otpNavigation'

const schema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a 10-digit mobile number')
    .max(10, 'Enter a 10-digit mobile number')
    .regex(/^\d+$/, 'Digits only'),
})

type FormValues = z.infer<typeof schema>

export function PhoneOtpForm({
  role,
  mode,
  submitLabel,
  premium = false,
}: {
  role: OtpRole
  mode: 'login' | 'register'
  submitLabel: string
  premium?: boolean
}) {
  const navigate = useNavigate()
  const requestOtp = useAuth((s) => s.requestOtp)
  const setPending = useOtpStore((s) => s.setPending)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    setIsSending(true)
    const otpSession: OtpNavigationState = { phone: values.phone, role, mode }
    try {
      await requestOtp({ phone: values.phone, role })
      setPending(otpSession)
      navigate('/otp', { replace: true, state: otpSession })
    } catch (e: unknown) {
      setFormError(getApiErrorMessage(e, 'Failed to send OTP'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form className={premium ? 'space-y-6' : 'space-y-4'} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={premium ? 'space-y-3' : ''}>
        <label
          className={
            premium
              ? 'mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 opacity-80'
              : 'mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500'
          }
        >
          {premium ? (
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              phone_iphone
            </span>
          ) : null}
          Mobile number
        </label>
        <div
          className={
            premium
              ? 'flex items-center border-b-2 border-emerald-900/10 bg-white/40 px-2 py-4 transition-all duration-300 focus-within:border-emerald-800'
              : 'flex items-center border-b-2 border-emerald-900/10 bg-white/40 px-2 py-3 transition focus-within:border-emerald-800'
          }
        >
          <span className="border-r border-emerald-900/10 pr-4 font-bold text-emerald-800">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder={premium ? '00000 00000' : '98765 43210'}
            className={
              premium
                ? 'ml-4 w-full border-none bg-transparent text-[20px] font-bold tracking-[0.1em] text-zinc-900 placeholder:font-normal placeholder:text-zinc-400/60 focus:outline-none focus:ring-0 dark:text-white'
                : 'ml-4 w-full border-none bg-transparent text-lg font-semibold tracking-wider text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 focus:outline-none focus:ring-0 dark:text-white'
            }
            {...register('phone', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
              },
            })}
          />
        </div>
        {errors.phone ? <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p> : null}
      </div>

      <AuthError message={formError} />

      <PremiumButton
        type="submit"
        disabled={isSending}
        className={premium ? 'group relative h-16 overflow-hidden text-[20px] font-bold tracking-wide' : undefined}
      >
        {isSending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending OTP…
          </>
        ) : (
          <>
            <span className="relative z-10 font-bold tracking-wide">{submitLabel}</span>
            {premium ? (
              <>
                <span
                  className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-1"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  arrow_forward
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              </>
            ) : null}
          </>
        )}
      </PremiumButton>
    </form>
  )
}
