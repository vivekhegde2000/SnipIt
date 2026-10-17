import { safeStorage } from '@/lib/storage'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEMES: readonly Theme[] = ['light', 'dark', 'system']

/** Must match the inline script in index.html. */
export const THEME_STORAGE_KEY = 'snipit:theme'

/** Browser UI colour (address bar, PWA title bar) per theme — matches `--background`. */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#fafafa',
  dark: '#09090b',
}

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readStoredTheme(): Theme {
  const stored = safeStorage.get(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : 'system'
}

export function writeStoredTheme(theme: Theme): void {
  if (theme === 'system') safeStorage.remove(THEME_STORAGE_KEY)
  else safeStorage.set(THEME_STORAGE_KEY, theme)
}
