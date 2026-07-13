import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/api/services'
import type { SellerDeliverySettings } from '@/api/services/sellerService'
import { SellerPageShell } from '@/components/seller/SellerPageShell'
import { StoreLocationRadiusPicker } from '@/components/seller/StoreLocationRadiusPicker'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'

export function SellerDeliveryPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [employeeName, setEmployeeName] = useState('')
  const [employeePhone, setEmployeePhone] = useState('')

  const { data: settingsData } = useQuery({
    queryKey: ['seller', 'delivery', 'settings'],
    queryFn: () => sellerService.getDeliverySettings(),
  })

  const { data: employeesData } = useQuery({
    queryKey: ['seller', 'delivery', 'employees'],
    queryFn: () => sellerService.listDeliveryEmployees(),
  })

  const settings = settingsData?.data
  const employees = employeesData?.data ?? []
  const maxRadiusKm = settings?.max_delivery_radius_km ?? 15

  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [radiusKm, setRadiusKm] = useState(5)
  const [addressLine, setAddressLine] = useState('')
  const [locationDirty, setLocationDirty] = useState(false)

  useEffect(() => {
    if (!settings || locationDirty) return
    setLatitude(settings.latitude ?? null)
    setLongitude(settings.longitude ?? null)
    setRadiusKm(settings.delivery_radius_km ?? 5)
    setAddressLine(settings.address_line ?? '')
  }, [settings, locationDirty])

  const updateSettings = useMutation({
    mutationFn: (payload: Partial<SellerDeliverySettings>) => sellerService.updateDeliverySettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'delivery', 'settings'] })
      setLocationDirty(false)
    },
  })

  const createEmployee = useMutation({
    mutationFn: () =>
      sellerService.createDeliveryEmployee({
        display_name: employeeName.trim(),
        phone: employeePhone.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'delivery', 'employees'] })
      setEmployeeName('')
      setEmployeePhone('')
    },
  })

  const deleteEmployee = useMutation({
    mutationFn: (uuid: string) => sellerService.deleteDeliveryEmployee(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller', 'delivery', 'employees'] }),
  })

  const saveStoreLocation = () => {
    if (latitude == null || longitude == null) return
    updateSettings.mutate({
      latitude,
      longitude,
      delivery_radius_km: radiusKm,
      address_line: addressLine || undefined,
      offers_own_delivery: settings?.offers_own_delivery ?? true,
    })
  }

  return (
    <SellerPageShell pathname={location.pathname} className="space-y-4 lg:space-y-6">
      <div className="hidden lg:block">
        <h1 className="text-headline-xl text-primary">Delivery</h1>
        <p className="text-body-md text-on-surface-variant">
          Pin your store on the map and set how far you deliver.
        </p>
      </div>

      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <h2 className="text-headline-lg mb-4">Store location &amp; range</h2>

        <StoreLocationRadiusPicker
          latitude={latitude}
          longitude={longitude}
          radiusKm={radiusKm}
          maxRadiusKm={maxRadiusKm}
          addressLine={addressLine}
          onLocationChange={({ latitude: lat, longitude: lng, addressLine: line }) => {
            setLocationDirty(true)
            setLatitude(lat)
            setLongitude(lng)
            if (line) setAddressLine(line)
          }}
          onRadiusChange={(value) => {
            setLocationDirty(true)
            setRadiusKm(value)
          }}
        />

        <button
          type="button"
          disabled={updateSettings.isPending || latitude == null || longitude == null || !locationDirty}
          onClick={saveStoreLocation}
          className="text-label-md mt-4 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-50"
        >
          {updateSettings.isPending ? 'Saving…' : 'Save store location'}
        </button>
        {updateSettings.isError ? (
          <p className="mt-2 text-sm text-error">{getApiErrorMessage(updateSettings.error, 'Save failed')}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <h2 className="text-headline-lg mb-4">Delivery options</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.offers_own_delivery ?? false}
              disabled={latitude == null || longitude == null}
              onChange={(e) =>
                updateSettings.mutate({
                  offers_own_delivery: e.target.checked,
                  ...(latitude != null && longitude != null
                    ? { latitude, longitude, delivery_radius_km: radiusKm }
                    : {}),
                })
              }
            />
            <span>Offer own delivery (use your radius circle above)</span>
          </label>
          {!latitude || !longitude ? (
            <p className="text-label-md text-on-surface-variant">Save a store pin first to enable own delivery.</p>
          ) : null}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.offers_platform_delivery ?? false}
              onChange={(e) => updateSettings.mutate({ offers_platform_delivery: e.target.checked })}
            />
            <span>Use platform delivery (within {maxRadiusKm} km platform limit)</span>
          </label>
        </div>
        {updateSettings.isError && !locationDirty ? (
          <p className="mt-2 text-sm text-error">{getApiErrorMessage(updateSettings.error, 'Update failed')}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <h2 className="text-headline-lg mb-4">Delivery team</h2>
        <form
          className="mb-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            createEmployee.mutate()
          }}
        >
          <input
            required
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Name"
            className="rounded-lg border border-outline-variant px-3 py-2"
          />
          <input
            required
            value={employeePhone}
            onChange={(e) => setEmployeePhone(e.target.value)}
            placeholder="Phone"
            className="rounded-lg border border-outline-variant px-3 py-2"
          />
          <button type="submit" disabled={createEmployee.isPending} className="rounded-lg bg-primary px-4 py-2 text-on-primary">
            Add
          </button>
        </form>
        <ul className="space-y-2">
          {employees.map((employee) => (
            <li key={employee.uuid} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
              <span>
                {employee.display_name} · {employee.phone}
              </span>
              <button type="button" className="text-error" onClick={() => deleteEmployee.mutate(employee.uuid)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </SellerPageShell>
  )
}
