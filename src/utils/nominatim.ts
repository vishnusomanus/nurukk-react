const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'VegReactMarketplace/1.0'

export type GeocodedAddress = {
  lat: number
  lng: number
  addressLine?: string
  city?: string
  pincode?: string
  displayName?: string
}

type NominatimAddress = {
  house_number?: string
  road?: string
  neighbourhood?: string
  suburb?: string
  city?: string
  town?: string
  village?: string
  county?: string
  state?: string
  postcode?: string
}

type NominatimReverseResponse = {
  lat?: string
  lon?: string
  display_name?: string
  address?: NominatimAddress
}

type NominatimSearchResult = {
  lat: string
  lon: string
  display_name: string
  address?: NominatimAddress
}

async function nominatimFetch<T>(path: string, params: Record<string, string>) {
  const url = new URL(path, NOMINATIM_BASE)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': USER_AGENT,
    },
  })

  if (!response.ok) {
    throw new Error('Location lookup failed. Please try again.')
  }

  return (await response.json()) as T
}

function pickCity(address: NominatimAddress) {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.suburb ??
    address.neighbourhood ??
    address.county ??
    ''
  )
}

function pickAddressLine(address: NominatimAddress, displayName?: string) {
  const line = [address.house_number, address.road ?? address.neighbourhood].filter(Boolean).join(', ')
  if (line) return line
  return displayName?.split(',')[0]?.trim() ?? ''
}

export function parseNominatimReverse(data: NominatimReverseResponse): GeocodedAddress {
  const address = data.address ?? {}
  const lat = Number(data.lat)
  const lng = Number(data.lon)

  return {
    lat,
    lng,
    addressLine: pickAddressLine(address, data.display_name),
    city: pickCity(address),
    pincode: address.postcode ?? '',
    displayName: data.display_name,
  }
}

export function parseNominatimSearch(result: NominatimSearchResult): GeocodedAddress {
  const address = result.address ?? {}

  return {
    lat: Number(result.lat),
    lng: Number(result.lon),
    addressLine: pickAddressLine(address, result.display_name),
    city: pickCity(address),
    pincode: address.postcode ?? '',
    displayName: result.display_name,
  }
}

export async function reverseGeocode(lat: number, lng: number) {
  const data = await nominatimFetch<NominatimReverseResponse>('/reverse', {
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  })

  return parseNominatimReverse(data)
}

export async function searchLocations(query: string, limit = 5) {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const results = await nominatimFetch<NominatimSearchResult[]>('/search', {
    q: trimmed,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'in',
  })

  return results.map(parseNominatimSearch)
}

export function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    })
  })
}

// Bangalore default — used when geolocation is unavailable
export const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 }
