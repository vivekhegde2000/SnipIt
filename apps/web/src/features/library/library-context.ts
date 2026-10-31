import { createContext, useContext } from 'react'
import type { Collection, Snippet } from '@snipit/shared'

export type TagCount = { tag: string; count: number }

export type LibraryCounts = {
  all: number
  favorites: number
  unsorted: number
  byCollection: ReadonlyMap<string, number>
  /** Snippets in the Trash. */
  trash: number
}

export type LibraryState = {
  /** `true` until the first IndexedDB read resolves. */
  isLoading: boolean
  /** Active snippets, most recently updated first. */
  snippets: readonly Snippet[]
  /** Snippets in the Trash, most recently deleted first. */
  trash: readonly Snippet[]
  /** Active collections in display order. */
  collections: readonly Collection[]
  collectionsById: ReadonlyMap<string, Collection>
  counts: LibraryCounts
  /** Every tag in use, most used first. */
  tags: readonly TagCount[]
}

export const LibraryContext = createContext<LibraryState | null>(null)

/** Live view of the user's library. Re-renders whenever IndexedDB changes (in any tab). */
export function useLibrary(): LibraryState {
  const context = useContext(LibraryContext)
  if (!context) throw new Error('useLibrary must be used within <LibraryProvider>')
  return context
}
