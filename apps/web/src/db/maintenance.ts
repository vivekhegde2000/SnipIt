import { db } from './db'

/**
 * Permanently removes every snippet, collection and setting stored on this device, in one
 * transaction (all or nothing). UI-only preferences in localStorage (e.g. theme) are kept.
 */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.snippets, db.collections, db.settings, async () => {
    await Promise.all([db.snippets.clear(), db.collections.clear(), db.settings.clear()])
  })
}
