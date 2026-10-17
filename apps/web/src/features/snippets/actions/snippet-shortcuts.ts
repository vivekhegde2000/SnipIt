import type { KeyboardEvent } from 'react'
import type { Snippet } from '@snipit/shared'
import { isEditableTarget } from '@/lib/keyboard'
import type { SnippetActions } from './use-snippet-actions'

/**
 * Single-key shortcuts that act on the focused snippet (card or detail view).
 * Returns `true` when the key was handled. Mirrors the hints shown in the "⋯" menu.
 */
export function handleSnippetShortcut(
  event: KeyboardEvent,
  snippet: Snippet,
  actions: SnippetActions,
): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false
  if (isEditableTarget(event.target)) return false
  // Keys pressed inside an open menu belong to the menu.
  if ((event.target as HTMLElement).closest('[role="menu"]')) return false

  const run: Record<string, () => void> = {
    c: () => void actions.copy(snippet),
    e: () => actions.edit(snippet),
    f: () => void actions.toggleFavorite(snippet),
    d: () => void actions.duplicate(snippet),
    o: () => actions.open(snippet),
    delete: () => void actions.remove(snippet),
  }
  const handler = run[event.key.toLowerCase()]
  if (!handler) return false
  event.preventDefault()
  event.stopPropagation()
  handler()
  return true
}
