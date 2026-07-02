import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { buyerService } from '@/api/services'
import type { BuyerAddress } from '@/api/services/buyerService'
import { useCheckoutStore } from '@/store/checkoutStore'

export function pickDefaultAddressUuid(addresses: BuyerAddress[]): string | null {
  if (addresses.length === 0) return null
  const match = addresses.find((a) => a.is_default) ?? addresses[0]
  return match?.uuid ?? null
}

export function useCheckoutAddress() {
  const addressUuid = useCheckoutStore((s) => s.addressUuid)
  const setAddressUuid = useCheckoutStore((s) => s.setAddressUuid)

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ['buyer', 'addresses'],
    queryFn: () => buyerService.listAddresses(),
  })

  const addresses = addressesData?.data ?? []
  const resolvedUuid = addressUuid ?? pickDefaultAddressUuid(addresses)
  const selectedAddress = addresses.find((a) => a.uuid === resolvedUuid) ?? null

  useEffect(() => {
    if (!addressUuid && addresses.length > 0) {
      const defaultUuid = pickDefaultAddressUuid(addresses)
      if (defaultUuid) setAddressUuid(defaultUuid)
    }
  }, [addresses, addressUuid, setAddressUuid])

  return {
    addresses,
    addressUuid: resolvedUuid,
    selectedAddress,
    hasAddress: !!selectedAddress,
    isLoading,
    setAddressUuid,
  }
}
