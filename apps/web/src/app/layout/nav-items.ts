import { Clock, FolderOpen, Layers, Settings, Star, type LucideIcon } from 'lucide-react'
import type { LibraryCounts } from '@/features/library/library-context'

export type NavItemConfig = {
  to: string
  label: string
  icon: LucideIcon
  /** Exact path match only (for `/`). */
  end?: boolean
  count?: (counts: LibraryCounts) => number
}

export const LIBRARY_NAV: readonly NavItemConfig[] = [
  { to: '/', label: 'All snippets', icon: Layers, end: true, count: (c) => c.all },
  { to: '/favorites', label: 'Favorites', icon: Star, count: (c) => c.favorites },
  { to: '/recent', label: 'Recent', icon: Clock },
]

export const SETTINGS_NAV: NavItemConfig = { to: '/settings', label: 'Settings', icon: Settings }

/** Mobile bottom navigation (max 4–5 items for comfortable thumb reach). */
export const BOTTOM_NAV: readonly NavItemConfig[] = [
  { to: '/', label: 'All', icon: Layers, end: true },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/collections', label: 'Collections', icon: FolderOpen },
  SETTINGS_NAV,
]

/** Number of tags listed in the sidebar before "more" (the rest stay reachable via filters). */
export const SIDEBAR_TAG_LIMIT = 15
