import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { setOnUnauthorized } from '@/api/client'

export function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    setOnUnauthorized(() => navigate('/', { replace: true }))
    return () => setOnUnauthorized(null)
  }, [navigate])

  return <Outlet />
}
