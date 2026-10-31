import { LIMITS, createId, snippetInputSchema, type Snippet, type SnippetFormValues } from '@snipit/shared'
import { db } from '../db'
import { RepositoryError, parseOrThrow } from '../errors'

function toFormValues(snippet: Snippet): SnippetFormValues {
  return {
    title: snippet.title,
    content: snippet.content,
    description: snippet.description,
    language: snippet.language,
    tags: snippet.tags,
    collectionId: snippet.collectionId,
    isFavorite: snippet.isFavorite,
  }
}

async function getActiveOrThrow(id: string): Promise<Snippet> {
  const snippet = await db.snippets.get(id)
  if (!snippet || snippet.deletedAt !== null) {
    throw new RepositoryError('NOT_FOUND', 'This snippet no longer exists.')
  }
  return snippet
}

/** Rejects writes that point at a missing or deleted collection. Must run inside a transaction. */
async function assertCollectionUsable(collectionId: string | null): Promise<void> {
  if (collectionId === null) return
  const collection = await db.collections.get(collectionId)
  if (!collection || collection.deletedAt !== null) {
    throw new RepositoryError('NOT_FOUND', 'The selected collection no longer exists.')
  }
}

/**
 * All snippet reads and writes go through here. Every write is validated against the shared
 * schema, so nothing malformed can reach IndexedDB regardless of the caller.
 */
export const snippetRepository = {
  /** Every snippet, including those in the Trash, most recently updated first. */
  async listAll(): Promise<Snippet[]> {
    return db.snippets.orderBy('updatedAt').reverse().toArray()
  },

  async create(values: SnippetFormValues): Promise<Snippet> {
    const input = parseOrThrow(snippetInputSchema, values)

    return db.transaction('rw', db.snippets, db.collections, async () => {
      await assertCollectionUsable(input.collectionId)
      const now = Date.now()
      const snippet: Snippet = {
        id: createId(),
        ...input,
        copyCount: 0,
        lastCopiedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      await db.snippets.add(snippet)
      return snippet
    })
  },

  /** Applies a partial edit. The merged result is re-validated as a whole. */
  async update(id: string, patch: Partial<SnippetFormValues>): Promise<Snippet> {
    return db.transaction('rw', db.snippets, db.collections, async () => {
      const existing = await getActiveOrThrow(id)
      const input = parseOrThrow(snippetInputSchema, { ...toFormValues(existing), ...patch })
      if (input.collectionId !== existing.collectionId) {
        await assertCollectionUsable(input.collectionId)
      }
      const updated: Snippet = { ...existing, ...input, updatedAt: Date.now() }
      await db.snippets.put(updated)
      return updated
    })
  },

  async duplicate(id: string): Promise<Snippet> {
    const source = await getActiveOrThrow(id)
    const suffix = ' (copy)'
    const title = source.title.slice(0, LIMITS.titleMax - suffix.length) + suffix
    return snippetRepository.create({ ...toFormValues(source), title, isFavorite: false })
  },

  async toggleFavorite(id: string): Promise<Snippet> {
    // Nested `update` joins this transaction, so the read and write are atomic.
    return db.transaction('rw', db.snippets, db.collections, async () => {
      const existing = await getActiveOrThrow(id)
      return snippetRepository.update(id, { isFavorite: !existing.isFavorite })
    })
  },

  async softDelete(id: string): Promise<void> {
    await db.transaction('rw', db.snippets, async () => {
      const existing = await getActiveOrThrow(id)
      const now = Date.now()
      await db.snippets.put({ ...existing, deletedAt: now, updatedAt: now })
    })
  },

  /**
   * Brings a snippet back from the Trash. If its collection was deleted in the meantime, the
   * snippet comes back unsorted rather than pointing at a collection that no longer exists.
   */
  async restore(id: string): Promise<Snippet> {
    return db.transaction('rw', db.snippets, db.collections, async () => {
      const existing = await db.snippets.get(id)
      if (!existing) throw new RepositoryError('NOT_FOUND', 'This snippet no longer exists.')
      const collection = existing.collectionId ? await db.collections.get(existing.collectionId) : undefined
      const collectionId = collection && collection.deletedAt === null ? collection.id : null
      const restored: Snippet = { ...existing, collectionId, deletedAt: null, updatedAt: Date.now() }
      await db.snippets.put(restored)
      return restored
    })
  },

  /** Permanently removes a snippet that is in the Trash. Active snippets are never hard-deleted. */
  async deleteForever(id: string): Promise<void> {
    await db.transaction('rw', db.snippets, async () => {
      const existing = await db.snippets.get(id)
      if (!existing) return
      if (existing.deletedAt === null) {
        throw new RepositoryError('CONFLICT', 'This snippet was restored and is no longer in the Trash.')
      }
      await db.snippets.delete(id)
    })
  },

  /** Permanently removes everything in the Trash. Returns how many snippets were removed. */
  async emptyTrash(): Promise<number> {
    return db.snippets.filter((snippet) => snippet.deletedAt !== null).delete()
  },

  /**
   * Records a copy. Deliberately does NOT bump `updatedAt`: usage stats are not an edit, and
   * bumping it would let a stale copy override a newer content edit during Phase 2 sync.
   */
  async recordCopy(id: string): Promise<void> {
    await db.snippets
      .where('id')
      .equals(id)
      .modify((snippet) => {
        snippet.copyCount += 1
        snippet.lastCopiedAt = Date.now()
      })
  },
}
