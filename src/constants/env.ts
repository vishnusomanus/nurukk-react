const raw = import.meta.env.VITE_API_BASE_URL
if (typeof raw !== 'string' || !raw.trim()) {
  throw new Error(
    'Set VITE_API_BASE_URL in a .env file at the project root (see .env.example).',
  )
}

/** Axios `baseURL`; set via `VITE_API_BASE_URL` in `.env`. */
export const API_BASE_URL = raw.trim()
export const DEV = import.meta.env.DEV
