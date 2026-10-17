/**
 * Keyboard shortcut reference, rendered by the cheat sheet (`?`). Keep in sync with
 * `use-global-shortcuts.ts` (global keys) and `snippet-shortcuts.ts` (focused-snippet keys).
 * The token `Mod` renders as ⌘ on Apple platforms and Ctrl elsewhere.
 */
export type ShortcutItem = {
  label: string
  /** Each entry is one key combination (keys pressed together). */
  keys: string[][]
  /** How multiple combinations relate: alternatives ("or") or a sequence ("then"). */
  joiner?: 'or' | 'then'
}

export type ShortcutGroup = { title: string; items: ShortcutItem[] }

export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: 'General',
    items: [
      { label: 'Command palette', keys: [['Mod', 'K']] },
      { label: 'Search snippets', keys: [['/']] },
      { label: 'New snippet', keys: [['N']] },
      { label: 'Keyboard shortcuts', keys: [['?']] },
      { label: 'Close / clear search', keys: [['Esc']] },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { label: 'Go to All snippets', keys: [['G'], ['A']], joiner: 'then' },
      { label: 'Go to Favorites', keys: [['G'], ['F']], joiner: 'then' },
      { label: 'Go to Recent', keys: [['G'], ['R']], joiner: 'then' },
      { label: 'Go to Collections', keys: [['G'], ['C']], joiner: 'then' },
      { label: 'Go to Settings', keys: [['G'], ['S']], joiner: 'then' },
      { label: 'Next / previous snippet', keys: [['J'], ['K']], joiner: 'or' },
      { label: 'Move between cards', keys: [['←', '↑', '→', '↓']] },
    ],
  },
  {
    title: 'Focused snippet',
    items: [
      { label: 'Open details', keys: [['Enter'], ['O']], joiner: 'or' },
      { label: 'Copy', keys: [['C']] },
      { label: 'Edit', keys: [['E']] },
      { label: 'Favorite', keys: [['F']] },
      { label: 'Duplicate', keys: [['D']] },
      { label: 'Delete', keys: [['Del']] },
    ],
  },
  {
    title: 'Editor',
    items: [
      {
        label: 'Save',
        keys: [
          ['Mod', 'S'],
          ['Mod', 'Enter'],
        ],
        joiner: 'or',
      },
      { label: 'Close', keys: [['Esc']] },
    ],
  },
  {
    title: 'Command palette',
    items: [
      { label: 'Copy snippet / run action', keys: [['Enter']] },
      { label: 'Open snippet details', keys: [['Mod', 'Enter']] },
      { label: 'Move selection', keys: [['↑', '↓']] },
    ],
  },
]
