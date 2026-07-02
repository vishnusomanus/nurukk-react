import { useEffect, useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { PremiumOtpTemplate } from '@/components/auth/templates/PremiumOtpTemplate'
import { useOtpStore } from '@/store/otpStore'
import { isOtpNavigationState, parseOtpSearchParams } from '@/utils/otpNavigation'

export function OtpPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const pending = useOtpStore((s) => s.pending)
  const setPending = useOtpStore((s) => s.setPending)
  const [ready, setReady] = useState(() => useOtpStore.persist.hasHydrated())

  useEffect(() => {
    if (useOtpStore.persist.hasHydrated()) {
      setReady(true)
      return
    }
    return useOtpStore.persist.onFinishHydration(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return

    const fromRouter = isOtpNavigationState(location.state) ? location.state : null
    const fromQuery = parseOtpSearchParams(searchParams)

    const next = fromRouter ?? fromQuery
    if (!next) return

    if (
      pending?.phone !== next.phone ||
      pending?.role !== next.role ||
      pending?.mode !== next.mode
    ) {
      setPending(next)
    }
  }, [ready, location.state, searchParams, pending, setPending])

  if (!ready) {
    return (
      <div className="stitch-auth-page stitch-body stitch-otp-bg flex min-h-dvh items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    )
  }

  const session = pending?.phone ? pending : null
  const fallback = isOtpNavigationState(location.state)
    ? location.state
    : parseOtpSearchParams(searchParams)
  const active = session ?? fallback

  if (!active?.phone) {
    return <Navigate to="/" replace />
  }

  return (
    <PremiumOtpTemplate phone={active.phone} role={active.role} mode={active.mode} />
  )
}
