import { useEffect, useMemo, useState } from 'react'

/**
 * Returns `true` only once `active` has stayed true for `delayMs`. Used for loading skeletons, so
 * fast loads (IndexedDB is usually <50 ms) don't flash a placeholder.
 *
 * Each activation gets its own token; the timer marks *that* token as elapsed. A new activation
 * starts with a fresh token, so no state reset (and no synchronous setState in an effect) is needed.
 */
export function useDelayedFlag(active: boolean, delayMs = 200): boolean {
  const activation = useMemo(() => (active ? {} : null), [active])
  const [elapsed, setElapsed] = useState<object | null>(null)

  useEffect(() => {
    if (!activation) return
    const timer = window.setTimeout(() => setElapsed(activation), delayMs)
    return () => window.clearTimeout(timer)
  }, [activation, delayMs])

  return activation !== null && elapsed === activation
}
