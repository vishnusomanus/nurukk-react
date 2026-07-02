import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { sellerService } from '@/api/services'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

export function SellerOnboardingPage() {
  const navigate = useNavigate()
  const initUser = useAuth((s) => s.initUser)
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')

  const register = useMutation({
    mutationFn: () =>
      sellerService.registerSeller({
        store_name: storeName.trim(),
        description: description.trim() || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
      }),
    onSuccess: async () => {
      await initUser()
      navigate('/seller', { replace: true })
    },
  })

  return (
    <div className="stitch-auth-page flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-8 shadow-lg">
        <h1 className="text-headline-xl mb-2 text-primary">Set up your farm store</h1>
        <p className="text-body-md mb-6 text-on-surface-variant">
          Tell buyers about your farm. Your application will be reviewed by our team.
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            register.mutate()
          }}
        >
          <label className="block">
            <span className="text-label-md mb-1 block">Store name</span>
            <input
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="text-body-md w-full rounded-lg border border-outline-variant px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-label-md mb-1 block">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-body-md w-full rounded-lg border border-outline-variant px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-label-md mb-1 block">City</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="text-body-md w-full rounded-lg border border-outline-variant px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-label-md mb-1 block">Pincode</span>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="text-body-md w-full rounded-lg border border-outline-variant px-3 py-2"
              />
            </label>
          </div>
          {register.isError ? (
            <p className="text-sm text-error">{getApiErrorMessage(register.error, 'Registration failed')}</p>
          ) : null}
          <button
            type="submit"
            disabled={register.isPending || !storeName.trim()}
            className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary disabled:opacity-60"
          >
            {register.isPending ? 'Submitting…' : 'Submit for verification'}
          </button>
        </form>
      </div>
    </div>
  )
}
