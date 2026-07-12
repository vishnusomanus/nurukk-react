const CALLBACK_NAME = '__nurukkGoogleMapsInit'

declare global {
  interface Window {
    google?: typeof google
    [CALLBACK_NAME]?: () => void
  }
}

let loadPromise: Promise<typeof google.maps> | null = null

export function getGoogleMapsApiKey() {
  return String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()
}

export function hasGoogleMapsApiKey() {
  return getGoogleMapsApiKey().length > 0
}

/** Loads the Maps JavaScript API once (Geocoder included). */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in the browser.'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (loadPromise) return loadPromise

  const key = getGoogleMapsApiKey()
  if (!key) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-nurukk-google-maps]')
    if (existing) {
      const wait = window.setInterval(() => {
        if (window.google?.maps) {
          window.clearInterval(wait)
          resolve(window.google.maps)
        }
      }, 50)
      window.setTimeout(() => {
        window.clearInterval(wait)
        if (!window.google?.maps) {
          loadPromise = null
          reject(new Error('Timed out loading Google Maps.'))
        }
      }, 15000)
      return
    }

    window[CALLBACK_NAME] = () => {
      delete window[CALLBACK_NAME]
      if (window.google?.maps) {
        resolve(window.google.maps)
      } else {
        loadPromise = null
        reject(new Error('Google Maps failed to initialize.'))
      }
    }

    const script = document.createElement('script')
    script.dataset.nurukkGoogleMaps = '1'
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&callback=${CALLBACK_NAME}`
    script.onerror = () => {
      loadPromise = null
      delete window[CALLBACK_NAME]
      reject(new Error('Failed to load Google Maps script.'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
