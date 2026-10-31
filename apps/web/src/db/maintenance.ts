import { TRASH_RETENTION_MS } from '@snipit/shared'
import { db } from './db'

/**
 * Permanently removes snippets that have been in the Trash longer than the retention period, and
 * collection tombstones of the same age. Returns how many records were removed.
 *
 * Phase 2 note: once sync exists, only tombstones that have already been synced may be purged,
 * otherwise other devices would never learn about the delete.
 */
export async function purgeExpiredTrash(now = Date.now()): Promise<number> {
  const cutoff = now - TRASH_RETENTION_MS
  const isExpired = (record: { deletedAt: number | null }) =>
    record.deletedAt !== null && record.deletedAt < cutoff
  return db.transaction('rw', db.snippets, db.collections, async () => {
    const [snippets, collections] = await Promise.all([
      db.snippets.filter(isExpired).delete(),
      db.collections.filter(isExpired).delete(),
    ])
    return snippets + collections
  })
}

/**
 * Permanently removes every snippet, collection and setting stored on this device, in one
 * transaction (all or nothing). UI-only preferences in localStorage (e.g. theme) are kept.
 */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.snippets, db.collections, db.settings, async () => {
    await Promise.all([db.snippets.clear(), db.collections.clear(), db.settings.clear()])
  })
}
