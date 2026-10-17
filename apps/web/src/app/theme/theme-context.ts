import { createContext, useContext } from 'react'
import type { ResolvedTheme, Theme } from './theme-storage'

export type ThemeContextValue = {
  /** The user's preference. */
  theme: Theme
  /** What is actually applied after resolving `system`. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within <ThemeProvider>')
  return context
}
