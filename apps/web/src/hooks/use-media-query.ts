import { useCallback, useSyncExternalStore } from 'react'

/** Subscribes to a CSS media query. Re-renders only when the match state flips. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/** Layout breakpoint matching Tailwind's `md` (768px) and `lg` (1024px). */
export function useBreakpoint(): Breakpoint {
  const isTabletUp = useMediaQuery('(min-width: 768px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  if (isDesktop) return 'desktop'
  return isTabletUp ? 'tablet' : 'mobile'
}
