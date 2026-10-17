import Dexie, { type EntityTable } from 'dexie'
import type { Collection, Settings, Snippet } from '@snipit/shared'

export const SETTINGS_KEY = 'app'

export type SettingsRow = Settings & { key: typeof SETTINGS_KEY }

/**
 * IndexedDB schema.
 *
 * Only fields with valid IndexedDB key types are indexed: `null` and booleans are not indexable,
 * so `deletedAt` / `isFavorite` are filtered in memory (the whole library is loaded for fuzzy
 * search anyway).
 *
 * Never edit an existing version — add `this.version(n + 1).stores(...).upgrade(...)` instead.
 */
class SnipItDatabase extends Dexie {
  declare snippets: EntityTable<Snippet, 'id'>
  declare collections: EntityTable<Collection, 'id'>
  declare settings: EntityTable<SettingsRow, 'key'>

  constructor() {
    super('snipit')

    this.version(1).stores({
      snippets: 'id, collectionId, *tags, updatedAt',
      collections: 'id, sortOrder',
      settings: 'key',
    })
  }
}

export const db = new SnipItDatabase()
