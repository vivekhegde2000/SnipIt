import { useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Collection, Snippet } from '@snipit/shared'
import { collectionRepository, snippetRepository } from '@/db'
import { LibraryContext, type LibraryCounts, type LibraryState, type TagCount } from './library-context'

const EMPTY_SNIPPETS: readonly Snippet[] = []
const EMPTY_COLLECTIONS: readonly Collection[] = []

function computeCounts(snippets: readonly Snippet[]): LibraryCounts {
  const byCollection = new Map<string, number>()
  let favorites = 0
  let unsorted = 0
  for (const snippet of snippets) {
    if (snippet.isFavorite) favorites++
    if (snippet.collectionId === null) unsorted++
    else byCollection.set(snippet.collectionId, (byCollection.get(snippet.collectionId) ?? 0) + 1)
  }
  return { all: snippets.length, favorites, unsorted, byCollection }
}

function computeTags(snippets: readonly Snippet[]): TagCount[] {
  const counts = new Map<string, number>()
  for (const snippet of snippets) {
    for (const tag of snippet.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/**
 * Loads the library once and shares it, so the sidebar, pages and dialogs don't each run their
 * own IndexedDB queries. Derived data is memoised and only recomputed when the data changes.
 */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const snippets = useLiveQuery(() => snippetRepository.listActive(), [])
  const collections = useLiveQuery(() => collectionRepository.listActive(), [])

  const value = useMemo<LibraryState>(() => {
    const snippetList = snippets ?? EMPTY_SNIPPETS
    const collectionList = collections ?? EMPTY_COLLECTIONS
    return {
      isLoading: snippets === undefined || collections === undefined,
      snippets: snippetList,
      collections: collectionList,
      collectionsById: new Map(collectionList.map((c) => [c.id, c])),
      counts: computeCounts(snippetList),
      tags: computeTags(snippetList),
    }
  }, [snippets, collections])

  return <LibraryContext value={value}>{children}</LibraryContext>
}
