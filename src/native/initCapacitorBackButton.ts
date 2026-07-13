import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { router } from '@/routes'
import {
  BOTTOM_NAV_HOME,
  BOTTOM_NAV_TO_HOME,
  resolveBreadcrumbBack,
} from '@/utils/breadcrumbBack'

/** Close the topmost dialog/sheet via Escape (modals already listen for it). */
function tryCloseOverlay(): boolean {
  if (!document.querySelector('[role="dialog"][aria-modal="true"]')) return false
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  )
  return true
}

function normalizePath(pathname: string) {
  const raw = pathname.split('?')[0]?.split('#')[0] ?? '/'
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1)
  return raw || '/'
}

/**
 * Register Android hardware back once (outside React) so route changes /
 * StrictMode remounts cannot drop the listener — which makes Capacitor
 * fall back to finishing the Activity (app "exits").
 *
 * Bottom-nav rules:
 * - Non-home tab → Home
 * - Home → minimize app
 * Nested screens still climb via breadcrumb parents.
 */
export function initCapacitorBackButton() {
  if (!Capacitor.isNativePlatform()) return

  void CapApp.addListener('backButton', () => {
    if (tryCloseOverlay()) return

    const { pathname, state } = router.state.location
    const path = normalizePath(pathname)

    const tabHome = BOTTOM_NAV_TO_HOME[path]
    if (tabHome) {
      void router.navigate(tabHome)
      return
    }

    if (BOTTOM_NAV_HOME.has(path)) {
      void CapApp.minimizeApp()
      return
    }

    const from =
      typeof state === 'object' &&
      state &&
      'from' in state &&
      typeof (state as { from?: unknown }).from === 'string'
        ? (state as { from: string }).from
        : null

    const target = resolveBreadcrumbBack(path, from)
    if (target) {
      void router.navigate(target)
      return
    }

    // Nested under a role with no rule — land on that role's Home.
    if (path.startsWith('/buyer')) {
      void router.navigate('/buyer')
      return
    }
    if (path.startsWith('/seller')) {
      void router.navigate('/seller')
      return
    }
    if (path.startsWith('/delivery')) {
      void router.navigate('/delivery')
      return
    }

    void CapApp.minimizeApp()
  })
}
