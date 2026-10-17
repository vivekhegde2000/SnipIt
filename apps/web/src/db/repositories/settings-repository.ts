import { DEFAULT_SETTINGS, settingsSchema, type Settings } from '@snipit/shared'
import { SETTINGS_KEY, db } from '../db'
import { parseOrThrow } from '../errors'

export const settingsRepository = {
  /** Current settings; missing or corrupt values fall back to defaults. */
  async get(): Promise<Settings> {
    const row = await db.settings.get(SETTINGS_KEY)
    if (!row) return DEFAULT_SETTINGS
    const result = settingsSchema.safeParse(row)
    return result.success ? result.data : DEFAULT_SETTINGS
  },

  async update(patch: Partial<Settings>): Promise<Settings> {
    return db.transaction('rw', db.settings, async () => {
      const current = await settingsRepository.get()
      const next = parseOrThrow(settingsSchema, { ...current, ...patch })
      await db.settings.put({ key: SETTINGS_KEY, ...next })
      return next
    })
  },
}
