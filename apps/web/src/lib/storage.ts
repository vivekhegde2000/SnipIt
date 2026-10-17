/**
 * `localStorage` wrapper that never throws. Storage can be unavailable (privacy mode, disabled
 * cookies, quota exceeded), and losing a UI preference must never break the app.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Ignore: preference simply won't persist.
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore.
    }
  },
}
