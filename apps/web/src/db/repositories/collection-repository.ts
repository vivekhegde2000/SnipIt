import { collectionInputSchema, createId, type Collection, type CollectionFormValues } from '@snipit/shared'
import { db } from '../db'
import { RepositoryError, parseOrThrow } from '../errors'

function byOrder(a: Collection, b: Collection): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

async function getActiveOrThrow(id: string): Promise<Collection> {
  const collection = await db.collections.get(id)
  if (!collection || collection.deletedAt !== null) {
    throw new RepositoryError('NOT_FOUND', 'This collection no longer exists.')
  }
  return collection
}

async function assertUniqueName(name: string, exceptId?: string): Promise<void> {
  const target = name.toLocaleLowerCase()
  const clash = await db.collections
    .filter((c) => c.deletedAt === null && c.id !== exceptId && c.name.toLocaleLowerCase() === target)
    .first()
  if (clash) throw new RepositoryError('CONFLICT', `A collection named "${clash.name}" already exists.`)
}

export const collectionRepository = {
  /** Active collections in display order. */
  async listActive(): Promise<Collection[]> {
    const all = await db.collections.toArray()
    return all.filter((c) => c.deletedAt === null).sort(byOrder)
  },

  async create(values: CollectionFormValues): Promise<Collection> {
    const input = parseOrThrow(collectionInputSchema, values)

    return db.transaction('rw', db.collections, async () => {
      await assertUniqueName(input.name)
      const last = await db.collections.orderBy('sortOrder').last()
      const now = Date.now()
      const collection: Collection = {
        id: createId(),
        ...input,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      await db.collections.add(collection)
      return collection
    })
  },

  async update(id: string, patch: Partial<CollectionFormValues>): Promise<Collection> {
    return db.transaction('rw', db.collections, async () => {
      const existing = await getActiveOrThrow(id)
      const input = parseOrThrow(collectionInputSchema, {
        name: existing.name,
        color: existing.color,
        icon: existing.icon,
        ...patch,
      })
      if (input.name.toLocaleLowerCase() !== existing.name.toLocaleLowerCase()) {
        await assertUniqueName(input.name, id)
      }
      const updated: Collection = { ...existing, ...input, updatedAt: Date.now() }
      await db.collections.put(updated)
      return updated
    })
  },

  /**
   * Soft-deletes the collection. Its snippets are kept and become unsorted.
   * Returns the ids of those snippets so the deletion can be undone with {@link restore}.
   */
  async softDelete(id: string): Promise<{ snippetIds: string[] }> {
    return db.transaction('rw', db.collections, db.snippets, async () => {
      const existing = await getActiveOrThrow(id)
      const now = Date.now()
      const snippetIds = (await db.snippets.where('collectionId').equals(id).primaryKeys()) as string[]
      await db.collections.put({ ...existing, deletedAt: now, updatedAt: now })
      await db.snippets.where('collectionId').equals(id).modify({ collectionId: null, updatedAt: now })
      return { snippetIds }
    })
  },

  /**
   * Undoes {@link softDelete}: restores the collection and moves its former snippets back —
   * but only those still unsorted, so moves made in the meantime are respected.
   */
  async restore(id: string, snippetIds: readonly string[]): Promise<void> {
    await db.transaction('rw', db.collections, db.snippets, async () => {
      const existing = await db.collections.get(id)
      if (!existing) throw new RepositoryError('NOT_FOUND', 'This collection no longer exists.')
      if (existing.deletedAt === null) return
      await assertUniqueName(existing.name, id)
      const now = Date.now()
      await db.collections.put({ ...existing, deletedAt: null, updatedAt: now })
      await db.snippets
        .where('id')
        .anyOf([...snippetIds])
        .filter((snippet) => snippet.deletedAt === null && snippet.collectionId === null)
        .modify({ collectionId: id, updatedAt: now })
    })
  },
}
