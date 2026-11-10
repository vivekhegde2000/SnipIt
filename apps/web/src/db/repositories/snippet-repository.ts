import {
  LIMITS,
  createId,
  normalizeTags,
  snippetInputSchema,
  type Snippet,
  type SnippetFormValues,
} from '@snipit/shared'
import { db } from '../db'
import { RepositoryError, parseOrThrow } from '../errors'

/** One change applied to many snippets at once (bulk actions). Omitted fields are left alone. */
export type BulkSnippetChange = {
  collectionId?: string | null
  isFavorite?: boolean
  addTags?: readonly string[]
  removeTags?: readonly string[]
}

/** The fields a bulk change can touch, as they were before it — what Undo puts back. */
export type BulkSnippetSnapshot = Pick<Snippet, 'id' | 'collectionId' | 'isFavorite' | 'tags'>

export type BulkUpdateResult = {
  /** Snippets that actually changed, as they were before (for Undo). */
  before: BulkSnippetSnapshot[]
  /** Snippets that could not take every added tag because they reached the tag limit. */
  tagLimited: number
}

export type BulkRestoreResult = {
  restored: number
  /** Restored snippets whose collection was deleted meanwhile, so they came back unsorted. */
  unsorted: number
}

const sameTags = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((tag, index) => tag === b[index])

const snapshotOf = ({ id, collectionId, isFavorite, tags }: Snippet): BulkSnippetSnapshot => ({
  id,
  collectionId,
  isFavorite,
  tags,
})

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

  /* -----------------------------------------------------------------------------------------------
   * Bulk operations. Each runs in one transaction (all or nothing) and skips snippets that were
   * deleted meanwhile. Snippets the change doesn't alter are not written, so their `updatedAt`
   * stays put (it decides sync conflicts in Phase 2).
   * ---------------------------------------------------------------------------------------------*/

  /** Moves, (un)favorites and/or retags many active snippets at once. */
  async bulkUpdate(ids: readonly string[], change: BulkSnippetChange): Promise<BulkUpdateResult> {
    return db.transaction('rw', db.snippets, db.collections, async () => {
      if (change.collectionId !== undefined) await assertCollectionUsable(change.collectionId)
      const add = normalizeTags(change.addTags ?? [])
      const remove = new Set(normalizeTags(change.removeTags ?? []))
      const existing = await db.snippets.bulkGet([...ids])
      const now = Date.now()
      const before: BulkSnippetSnapshot[] = []
      const updates: Snippet[] = []
      let tagLimited = 0

      for (const snippet of existing) {
        if (!snippet || snippet.deletedAt !== null) continue
        const kept = snippet.tags.filter((tag) => !remove.has(tag))
        const merged = normalizeTags([...kept, ...add])
        if (add.some((tag) => !merged.includes(tag))) tagLimited++
        const next: Snippet = {
          ...snippet,
          collectionId: change.collectionId === undefined ? snippet.collectionId : change.collectionId,
          isFavorite: change.isFavorite ?? snippet.isFavorite,
          tags: merged,
        }
        const changed =
          next.collectionId !== snippet.collectionId ||
          next.isFavorite !== snippet.isFavorite ||
          !sameTags(next.tags, snippet.tags)
        if (!changed) continue
        before.push(snapshotOf(snippet))
        updates.push({ ...next, updatedAt: now })
      }

      await db.snippets.bulkPut(updates)
      return { before, tagLimited }
    })
  },

  /**
   * Undoes {@link bulkUpdate}: puts the saved fields back on snippets that are still active. A
   * collection deleted in the meantime can't be restored, so those snippets stay unsorted.
   */
  async revertBulkUpdate(before: readonly BulkSnippetSnapshot[]): Promise<void> {
    await db.transaction('rw', db.snippets, db.collections, async () => {
      const current = await db.snippets.bulkGet(before.map((snapshot) => snapshot.id))
      const collectionIds = [...new Set(before.flatMap((s) => (s.collectionId ? [s.collectionId] : [])))]
      const collections = await db.collections.bulkGet(collectionIds)
      const usable = new Set(collections.flatMap((c) => (c && c.deletedAt === null ? [c.id] : [])))
      const now = Date.now()
      const updates: Snippet[] = []
      before.forEach((snapshot, index) => {
        const snippet = current[index]
        if (!snippet || snippet.deletedAt !== null) return
        const collectionId =
          snapshot.collectionId && usable.has(snapshot.collectionId) ? snapshot.collectionId : null
        updates.push({
          ...snippet,
          collectionId,
          isFavorite: snapshot.isFavorite,
          tags: snapshot.tags,
          updatedAt: now,
        })
      })
      await db.snippets.bulkPut(updates)
    })
  },

  /** Moves many snippets to the Trash. Returns the ids that were actually moved (for Undo). */
  async softDeleteMany(ids: readonly string[]): Promise<string[]> {
    return db.transaction('rw', db.snippets, async () => {
      const existing = await db.snippets.bulkGet([...ids])
      const now = Date.now()
      const deleted = existing.flatMap((snippet) =>
        snippet && snippet.deletedAt === null ? [{ ...snippet, deletedAt: now, updatedAt: now }] : [],
      )
      await db.snippets.bulkPut(deleted)
      return deleted.map((snippet) => snippet.id)
    })
  },

  /** Brings many snippets back from the Trash (same collection rules as {@link restore}). */
  async restoreMany(ids: readonly string[]): Promise<BulkRestoreResult> {
    return db.transaction('rw', db.snippets, db.collections, async () => {
      const existing = await db.snippets.bulkGet([...ids])
      const inTrash = existing.filter(
        (snippet): snippet is Snippet => !!snippet && snippet.deletedAt !== null,
      )
      const collectionIds = [...new Set(inTrash.flatMap((s) => (s.collectionId ? [s.collectionId] : [])))]
      const collections = await db.collections.bulkGet(collectionIds)
      const usable = new Set(collections.flatMap((c) => (c && c.deletedAt === null ? [c.id] : [])))
      const now = Date.now()
      let unsorted = 0
      const restored = inTrash.map((snippet) => {
        const keep = snippet.collectionId !== null && usable.has(snippet.collectionId)
        if (snippet.collectionId !== null && !keep) unsorted++
        return {
          ...snippet,
          collectionId: keep ? snippet.collectionId : null,
          deletedAt: null,
          updatedAt: now,
        }
      })
      await db.snippets.bulkPut(restored)
      return { restored: restored.length, unsorted }
    })
  },

  /** Permanently removes the given snippets, but only those still in the Trash. Returns the count. */
  async deleteForeverMany(ids: readonly string[]): Promise<number> {
    return db.transaction('rw', db.snippets, async () => {
      const existing = await db.snippets.bulkGet([...ids])
      const inTrash = existing.flatMap((snippet) =>
        snippet && snippet.deletedAt !== null ? [snippet.id] : [],
      )
      await db.snippets.bulkDelete(inTrash)
      return inTrash.length
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
