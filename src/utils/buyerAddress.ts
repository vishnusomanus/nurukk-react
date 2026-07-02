import type { BuyerAddress } from '@/api/services/buyerService'

export function getAddressLine(addr: BuyerAddress) {
  return String(addr.address_line ?? addr.line1 ?? '')
}

export function formatBuyerAddressLines(addr: BuyerAddress) {
  const parts = [getAddressLine(addr), addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean)
  return parts
}

export function addressLabelIcon(label?: string) {
  const key = String(label ?? '').toLowerCase()
  if (key.includes('home')) {
    return { icon: 'home', wrap: 'bg-primary-fixed text-on-primary-fixed' }
  }
  if (key.includes('office') || key.includes('work')) {
    return { icon: 'business_center', wrap: 'bg-secondary-fixed text-on-secondary-fixed' }
  }
  if (key.includes('gym') || key.includes('fit')) {
    return { icon: 'fitness_center', wrap: 'bg-tertiary-fixed text-on-tertiary-fixed' }
  }
  return { icon: 'location_on', wrap: 'bg-surface-container-high text-on-surface-variant' }
}

export function formatAddressDisplay(addr: BuyerAddress) {
  return formatBuyerAddressLines(addr).join(', ')
}

export function addressDeliveryMeta(addr: BuyerAddress) {
  if (addr.is_default) return { est: '15-20 min', fee: 'Free' }
  const key = String(addr.label ?? '').toLowerCase()
  if (key.includes('office') || key.includes('work')) return { est: '25-30 min', fee: '₹45' }
  return { est: '35-40 min', fee: '₹60' }
}

export function composeAddressLine(flatBuilding: string, landmark?: string) {
  return [flatBuilding.trim(), landmark?.trim()].filter(Boolean).join(', ')
}
