import { useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Collection, Snippet } from '@snipit/shared'
import { collectionRepository, snippetRepository } from '@/db'
import { LibraryContext, type LibraryCounts, type LibraryState, type TagCount } from './library-context'

const EMPTY_SNIPPETS: readonly Snippet[] = []
const EMPTY_COLLECTIONS: readonly Collection[] = []

function computeCounts(snippets: readonly Snippet[], trash: number): LibraryCounts {
  const byCollection = new Map<string, number>()
  let favorites = 0
  let unsorted = 0
  for (const snippet of snippets) {
    if (snippet.isFavorite) favorites++
    if (snippet.collectionId === null) unsorted++
    else byCollection.set(snippet.collectionId, (byCollection.get(snippet.collectionId) ?? 0) + 1)
  }
  return { all: snippets.length, favorites, unsorted, byCollection, trash }
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

/** Splits one read of the table into the library and the Trash (order is kept). */
function splitByDeleted(all: readonly Snippet[]): { active: Snippet[]; trash: Snippet[] } {
  const active: Snippet[] = []
  const trash: Snippet[] = []
  for (const snippet of all) (snippet.deletedAt === null ? active : trash).push(snippet)
  trash.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
  return { active, trash }
}

/**
 * Loads the library once and shares it, so the sidebar, pages and dialogs don't each run their
 * own IndexedDB queries. Derived data is memoised and only recomputed when the data changes.
 */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const allSnippets = useLiveQuery(() => snippetRepository.listAll(), [])
  const collections = useLiveQuery(() => collectionRepository.listActive(), [])

  const value = useMemo<LibraryState>(() => {
    const { active, trash } = allSnippets
      ? splitByDeleted(allSnippets)
      : { active: EMPTY_SNIPPETS, trash: EMPTY_SNIPPETS }
    const collectionList = collections ?? EMPTY_COLLECTIONS
    return {
      isLoading: allSnippets === undefined || collections === undefined,
      snippets: active,
      trash,
      collections: collectionList,
      collectionsById: new Map(collectionList.map((c) => [c.id, c])),
      counts: computeCounts(active, trash.length),
      tags: computeTags(active),
    }
  }, [allSnippets, collections])

  return <LibraryContext value={value}>{children}</LibraryContext>
}
