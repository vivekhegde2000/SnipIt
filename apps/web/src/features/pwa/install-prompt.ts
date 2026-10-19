import { useSyncExternalStore } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallState = {
  /** The browser offered an install prompt we can trigger (Chromium-based browsers). */
  canInstall: boolean
  /** Running as an installed app (standalone window / home-screen app). */
  isInstalled: boolean
  /** iPhone/iPad: no install prompt API — show "Share → Add to Home Screen" instructions. */
  isIOS: boolean
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function detectStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function detectIOS(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

let snapshot: InstallState = { canInstall: false, isInstalled: false, isIOS: false }

function update(patch: Partial<InstallState>) {
  snapshot = { ...snapshot, ...patch }
  for (const listener of listeners) listener()
}

/**
 * Must run before React renders: browsers fire `beforeinstallprompt` once, early, and it is lost
 * if nobody is listening.
 */
export function initInstallPrompt(): void {
  snapshot = { canInstall: false, isInstalled: detectStandalone(), isIOS: detectIOS() }
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // keep it for our own "Install app" button
    deferredPrompt = event as BeforeInstallPromptEvent
    update({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    update({ canInstall: false, isInstalled: true })
  })
}

/** Shows the browser's install dialog. Resolves `true` if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const prompt = deferredPrompt
  if (!prompt) return false
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  deferredPrompt = null // a prompt can only be used once
  update({ canInstall: false })
  return outcome === 'accepted'
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, () => snapshot)
}
