import axios from 'axios'
import { API_BASE_URL } from '@/constants/env'
import { useAuthStore } from '@/store/authStore'

let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      useAuthStore.getState().clearAuth()
      onUnauthorized?.()
    }
    return Promise.reject(err)
  },
)
