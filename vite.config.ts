import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

function resolveBase(env: Record<string, string>): string {
  const configured = env.VITE_BASE_PATH?.trim()
  if (!configured) {
    return '/'
  }

  return configured.endsWith('/') ? configured : `${configured}/`
}

function resolveOutDir(mode: string): string {
  if (mode === 'buyer') return 'dist-buyer'
  if (mode === 'seller') return 'dist-seller'
  if (mode === 'delivery') return 'dist-delivery'
  if (mode === 'pages') return 'dist'
  if (mode === 'capacitor') return 'dist-buyer'
  return 'dist'
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const proxyTarget = env.API_PROXY_TARGET || 'http://localhost:8000'
  const apiPrefix =
    env.VITE_API_BASE_URL?.startsWith('/') === true
      ? env.VITE_API_BASE_URL
      : '/api'
  const base = resolveBase(env)

  return {
    base,
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
    preview: {
      port: 4173,
    },
    build: {
      outDir: resolveOutDir(mode),
      emptyOutDir: true,
    },
  }
})
