type NavigatorWithUAData = Navigator & { userAgentData?: { platform?: string } }

function detectApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as NavigatorWithUAData
  const platform = nav.userAgentData?.platform ?? nav.platform ?? ''
  return /mac|iphone|ipad|ipod/i.test(platform) || /Mac OS X|iPhone|iPad/.test(nav.userAgent)
}

/** True on macOS / iOS, where the primary shortcut modifier is ⌘ instead of Ctrl. */
export const isApplePlatform = detectApplePlatform()

/** Label for the primary shortcut modifier key. */
export const modKeyLabel = isApplePlatform ? '⌘' : 'Ctrl'

/** Whether the platform's primary modifier (⌘ on Apple, Ctrl elsewhere) is held. */
export function isModKey(event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey'>): boolean {
  return isApplePlatform ? event.metaKey : event.ctrlKey
}
