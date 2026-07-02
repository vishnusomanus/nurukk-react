import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { AuthError, AuthShell, PremiumButton } from '@/components/auth/AuthShell'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { getHomePathForRole } from '@/utils/authRole'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function AdminLoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const loginWithPassword = useAuth((s) => s.loginWithPassword)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    try {
      await loginWithPassword(values)
      const loggedInUser = useAuthStore.getState().user
      navigate(getHomePathForRole(loggedInUser?.role), { replace: true })
    } catch (e: unknown) {
      setFormError(getApiErrorMessage(e, 'Login failed'))
    }
  }

  return (
    <AuthShell title="Admin sign in" subtitle="Staff and administrator access only.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <AuthError message={formError} />
        <PremiumButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </PremiumButton>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link to="/" className="font-semibold text-emerald-800 hover:opacity-80 dark:text-emerald-300">
          Back to home
        </Link>
      </p>
    </AuthShell>
  )
}
