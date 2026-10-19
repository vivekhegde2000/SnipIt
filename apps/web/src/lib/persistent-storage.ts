import { safeStorage } from './storage'

const REQUESTED_KEY = 'snipit:persist-requested'

export type StorageInfo = {
  /** `null` when the browser doesn't support the Storage API. */
  persisted: boolean | null
  usage: number | null
  quota: number | null
}

/**
 * Asks the browser to keep this site's data even under storage pressure (otherwise IndexedDB is
 * "best effort" and can be evicted). Chrome decides silently; Firefox may show a prompt — so we
 * ask at most once automatically. Returns whether storage is persistent.
 */
export async function requestPersistentStorage({ force = false } = {}): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    if (await navigator.storage.persisted()) return true
    if (!force && safeStorage.get(REQUESTED_KEY)) return false
    safeStorage.set(REQUESTED_KEY, '1')
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const info: StorageInfo = { persisted: null, usage: null, quota: null }
  try {
    if (navigator.storage?.persisted) info.persisted = await navigator.storage.persisted()
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      info.usage = estimate.usage ?? null
      info.quota = estimate.quota ?? null
    }
  } catch {
    // Unsupported or blocked — the UI shows "unknown".
  }
  return info
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

/** 1536 → "1.5 KB". */
export function formatBytes(bytes: number): string {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`
}
