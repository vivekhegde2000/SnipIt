import { useState } from 'react'

/**
 * Content on the first screen of a visit renders without entrance animations:
 * - it must not wait for the lazily loaded animation features (that would hold back Largest
 *   Contentful Paint until an extra chunk has downloaded), and
 * - animating the initial page load only makes start-up feel slower.
 * Entrance animations resume after the first user interaction or history navigation.
 */
let initialScreen = true

const END_EVENTS = ['pointerdown', 'keydown', 'popstate'] as const

/** Call once, before the first render. */
export function trackInitialScreen(): void {
  const end = () => {
    initialScreen = false
    for (const type of END_EVENTS) window.removeEventListener(type, end, true)
  }
  for (const type of END_EVENTS) window.addEventListener(type, end, { capture: true, passive: true })
}

export function isInitialScreen(): boolean {
  return initialScreen
}

/** Whether a component should play its entrance animation. Decided once, at mount. */
export function useEntranceAnimation(): boolean {
  const [animate] = useState(() => !initialScreen)
  return animate
}
