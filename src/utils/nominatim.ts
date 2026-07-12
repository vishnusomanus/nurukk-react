import { hasGoogleMapsApiKey, loadGoogleMaps } from '@/utils/googleMapsLoader'

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

function component(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
  useShort = false,
) {
  const match = components?.find((entry) => entry.types.includes(type))
  return useShort ? (match?.short_name ?? '') : (match?.long_name ?? '')
}

function parseGoogleResult(result: google.maps.GeocoderResult): GeocodedAddress {
  const parts = result.address_components
  const lat = result.geometry.location.lat()
  const lng = result.geometry.location.lng()
  const streetNumber = component(parts, 'street_number')
  const route = component(parts, 'route')
  const neighbourhood =
    component(parts, 'neighborhood') ||
    component(parts, 'sublocality_level_1') ||
    component(parts, 'sublocality')
  const addressLine = [streetNumber, route || neighbourhood].filter(Boolean).join(', ')
  const city =
    component(parts, 'locality') ||
    component(parts, 'administrative_area_level_3') ||
    component(parts, 'administrative_area_level_2') ||
    neighbourhood

  return {
    lat,
    lng,
    addressLine: addressLine || result.formatted_address.split(',')[0]?.trim() || '',
    city,
    pincode: component(parts, 'postal_code'),
    displayName: result.formatted_address,
  }
}

async function googleReverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  await loadGoogleMaps()
  const geocoder = new google.maps.Geocoder()
  const response = await geocoder.geocode({ location: { lat, lng } })
  const result = response.results[0]
  if (!result) throw new Error('No address found for this location.')
  return parseGoogleResult(result)
}

async function googleSearchLocations(query: string, limit: number): Promise<GeocodedAddress[]> {
  await loadGoogleMaps()
  const geocoder = new google.maps.Geocoder()
  const response = await geocoder.geocode({
    address: query,
    componentRestrictions: { country: 'IN' },
  })
  return (response.results ?? []).slice(0, limit).map(parseGoogleResult)
}

async function nominatimReverseGeocode(lat: number, lng: number) {
  const data = await nominatimFetch<NominatimReverseResponse>('/reverse', {
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  })
  return parseNominatimReverse(data)
}

async function nominatimSearchLocations(query: string, limit: number) {
  const results = await nominatimFetch<NominatimSearchResult[]>('/search', {
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'in',
  })
  return results.map(parseNominatimSearch)
}

export async function reverseGeocode(lat: number, lng: number) {
  if (hasGoogleMapsApiKey()) {
    try {
      return await googleReverseGeocode(lat, lng)
    } catch {
      // Fall through to Nominatim if Google is unavailable / key restricted.
    }
  }
  return nominatimReverseGeocode(lat, lng)
}

export async function searchLocations(query: string, limit = 5) {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  if (hasGoogleMapsApiKey()) {
    try {
      return await googleSearchLocations(trimmed, limit)
    } catch {
      // Fall through to Nominatim if Google is unavailable / key restricted.
    }
  }
  return nominatimSearchLocations(trimmed, limit)
}

export type DevicePosition = {
  coords: {
    latitude: number
    longitude: number
  }
}

export async function getCurrentPosition(): Promise<DevicePosition> {
  const { Capacitor } = await import('@capacitor/core')

  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation')
    const permission = await Geolocation.checkPermissions()
    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
      const requested = await Geolocation.requestPermissions({ permissions: ['location'] })
      if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
        throw new Error('Location permission denied. Pin your location on the map instead.')
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    })

    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    }
  }

  return new Promise<DevicePosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        })
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60_000,
      },
    )
  })
}

// Bangalore default — used when geolocation is unavailable
export const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 }
