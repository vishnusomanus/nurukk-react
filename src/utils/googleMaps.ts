type MapsLocation = {
  latitude?: number | null
  longitude?: number | null
  addressLine?: string | null
  city?: string | null
  pincode?: string | null
}

export function buildGoogleMapsUrl(location: MapsLocation): string | null {
  const latitude = Number(location.latitude)
  const longitude = Number(location.longitude)

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }

  const query = [location.addressLine, location.city, location.pincode].filter(Boolean).join(', ')
  if (!query) return null

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function buildTelUrl(phone?: string | null): string | null {
  if (!phone) return null
  const normalized = String(phone).replace(/[^\d+]/g, '')
  return normalized ? `tel:${normalized}` : null
}
