import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ThemeContext, type ThemeContextValue } from './theme-context'
import {
  THEME_COLORS,
  THEME_STORAGE_KEY,
  isTheme,
  readStoredTheme,
  writeStoredTheme,
  type ResolvedTheme,
  type Theme,
} from './theme-storage'

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  // Suppress transitions for one frame so every surface switches colour at once.
  root.classList.add('theme-switching')
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved

  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = THEME_COLORS[resolved]
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove('theme-switching'))
  })
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolvedTheme: ResolvedTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  useLayoutEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      setThemeState(isTheme(event.newValue) ? event.newValue : 'system')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    writeStoredTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
