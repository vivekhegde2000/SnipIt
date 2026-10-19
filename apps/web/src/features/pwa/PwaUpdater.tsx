import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** How often an open app checks for a newly deployed version. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/**
 * Registers the service worker and surfaces its lifecycle as toasts:
 * - first install → "Ready to work offline"
 * - new deploy waiting → persistent "New version available · Reload" (never reloads by surprise,
 *   so nobody loses a half-written snippet)
 */
export function PwaUpdater() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => {
        if (navigator.onLine) void registration.update()
      }, UPDATE_CHECK_INTERVAL_MS)
    },
    onRegisterError(error) {
      console.error('Service worker registration failed', error)
    },
  })

  useEffect(() => {
    if (offlineReady) {
      toast.success('SnipIt is ready to work offline', { id: 'pwa-offline-ready' })
    }
  }, [offlineReady])

  useEffect(() => {
    if (!needRefresh) return
    toast('A new version of SnipIt is available', {
      id: 'pwa-update',
      duration: Number.POSITIVE_INFINITY,
      action: { label: 'Reload', onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
