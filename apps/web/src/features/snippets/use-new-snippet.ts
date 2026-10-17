import { useCallback, useMemo } from 'react'
import { useMatch } from 'react-router'
import { useSnippetEditor } from './editor/snippet-editor-context'

export type NewSnippetTrigger = {
  /** Opens the editor with context-aware defaults. */
  openNew: () => void
  /** Spread onto any "New snippet" button: opens on click, warms the editor on hover/focus. */
  triggerProps: {
    onClick: () => void
    onPointerEnter: () => void
    onFocus: () => void
  }
}

/**
 * "New snippet" with context-aware defaults: inside a collection the snippet goes into that
 * collection; on Favorites it starts starred.
 */
export function useNewSnippet(): NewSnippetTrigger {
  const { openCreate, preload } = useSnippetEditor()
  const collectionMatch = useMatch('/collections/:collectionId')
  const favoritesMatch = useMatch('/favorites')
  const collectionId = collectionMatch?.params.collectionId ?? null
  const isFavorites = favoritesMatch !== null

  const openNew = useCallback(() => {
    openCreate({
      ...(collectionId ? { collectionId } : {}),
      ...(isFavorites ? { isFavorite: true } : {}),
    })
  }, [openCreate, collectionId, isFavorites])

  return useMemo(
    () => ({ openNew, triggerProps: { onClick: openNew, onPointerEnter: preload, onFocus: preload } }),
    [openNew, preload],
  )
}
