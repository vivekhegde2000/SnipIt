import { useCallback } from 'react'
import { useMatch } from 'react-router'
import { useSnippetEditor } from './editor/snippet-editor-context'

/**
 * Opens the editor for a new snippet with context-aware defaults: inside a collection the
 * snippet goes into that collection; on Favorites it starts starred.
 */
export function useNewSnippet(): () => void {
  const { openCreate } = useSnippetEditor()
  const collectionMatch = useMatch('/collections/:collectionId')
  const favoritesMatch = useMatch('/favorites')
  const collectionId = collectionMatch?.params.collectionId ?? null
  const isFavorites = favoritesMatch !== null

  return useCallback(() => {
    openCreate({
      ...(collectionId ? { collectionId } : {}),
      ...(isFavorites ? { isFavorite: true } : {}),
    })
  }, [openCreate, collectionId, isFavorites])
}
