import { createContext, useContext } from 'react'
import type { Collection } from '@snipit/shared'

export type CreateCollectionOptions = {
  /** Called after a successful create (e.g. to select it in the snippet editor). */
  onCreated?: (collection: Collection) => void
}

export type CollectionEditorApi = {
  create: (options?: CreateCollectionOptions) => void
  edit: (collectionId: string) => void
  /** Asks for confirmation, deletes (snippets become unsorted) and offers Undo. */
  remove: (collection: Collection) => void
}

export const CollectionEditorContext = createContext<CollectionEditorApi | null>(null)

export function useCollectionEditor(): CollectionEditorApi {
  const context = useContext(CollectionEditorContext)
  if (!context) throw new Error('useCollectionEditor must be used within <CollectionEditorProvider>')
  return context
}
