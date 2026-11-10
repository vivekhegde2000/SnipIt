import { useSyncExternalStore } from 'react'
import { safeStorage } from '@/lib/storage'

/** How snippet lists are shown. A per-device preference, like the theme. */
export type ViewLayout = 'grid' | 'list'

export const VIEW_LAYOUT_STORAGE_KEY = 'snipit:view-layout'
const DEFAULT_LAYOUT: ViewLayout = 'grid'

const listeners = new Set<() => void>()

function read(): ViewLayout {
  return safeStorage.get(VIEW_LAYOUT_STORAGE_KEY) === 'list' ? 'list' : DEFAULT_LAYOUT
}

let current = read()

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed it: follow along.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== VIEW_LAYOUT_STORAGE_KEY && event.key !== null) return
    const next = read()
    if (next !== current) {
      current = next
      notify()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function setViewLayout(layout: ViewLayout): void {
  if (layout === current) return
  current = layout
  if (layout === DEFAULT_LAYOUT) safeStorage.remove(VIEW_LAYOUT_STORAGE_KEY)
  else safeStorage.set(VIEW_LAYOUT_STORAGE_KEY, layout)
  notify()
}

export function toggleViewLayout(): ViewLayout {
  const next = current === 'grid' ? 'list' : 'grid'
  setViewLayout(next)
  return next
}

export function useViewLayout(): ViewLayout {
  return useSyncExternalStore(subscribe, () => current)
}
