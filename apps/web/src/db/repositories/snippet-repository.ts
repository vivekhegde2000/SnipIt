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
  /** Active (not deleted) snippets, most recently updated first. */
  async listActive(): Promise<Snippet[]> {
    const all = await db.snippets.orderBy('updatedAt').reverse().toArray()
    return all.filter((s) => s.deletedAt === null)
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

  async restore(id: string): Promise<void> {
    await db.transaction('rw', db.snippets, async () => {
      const existing = await db.snippets.get(id)
      if (!existing) throw new RepositoryError('NOT_FOUND', 'This snippet no longer exists.')
      await db.snippets.put({ ...existing, deletedAt: null, updatedAt: Date.now() })
    })
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
