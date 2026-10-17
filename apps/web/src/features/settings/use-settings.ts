import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_SETTINGS, type Settings } from '@snipit/shared'
import { settingsRepository } from '@/db'

/** Live app settings (defaults until the first read resolves). */
export function useSettings(): Settings {
  return useLiveQuery(() => settingsRepository.get(), [], DEFAULT_SETTINGS)
}
