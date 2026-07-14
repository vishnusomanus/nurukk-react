import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function showBootError(err: unknown) {
  const root = document.getElementById('root')
  if (!root) return
  const msg =
    err instanceof Error
      ? `${err.name}: ${err.message}\n\n${err.stack ?? ''}`
      : typeof err === 'string'
        ? err
        : JSON.stringify(err, null, 2)
  root.innerHTML = `<pre style="box-sizing:border-box;min-height:100dvh;margin:0;padding:20px;white-space:pre-wrap;word-break:break-word;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;color:#7f1d1d;background:#fef2f2">${msg
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')}</pre>`
}

window.addEventListener('error', (event) => {
  showBootError(event.error ?? event.message)
})
window.addEventListener('unhandledrejection', (event) => {
  showBootError(event.reason)
})

async function boot() {
  try {
    const [{ default: App }, { initCapacitorBackButton }] = await Promise.all([
      import('./App'),
      import('@/native/initCapacitorBackButton'),
    ])

    try {
      initCapacitorBackButton()
    } catch (err) {
      console.warn('[boot] back button init failed', err)
    }

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    try {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        const { SplashScreen } = await import('@capacitor/splash-screen')
        await SplashScreen.hide()
      }
    } catch {
      // Splash plugin optional
    }
  } catch (err) {
    console.error('[boot] failed', err)
    showBootError(err)
  }
}

void boot()
