import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const proxyTarget = env.API_PROXY_TARGET || 'http://localhost:8000'
  const apiPrefix =
    env.VITE_API_BASE_URL?.startsWith('/') === true
      ? env.VITE_API_BASE_URL
      : '/api'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    server: {
      port: 3000,
      proxy: {
        [apiPrefix]: {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
