import { createContext, useContext } from 'react'
import type { Collection } from '@snipit/shared'

export type BackupApi = {
  /** Downloads a backup of the whole library (and records it as the last backup). */
  exportAll: () => Promise<void>
  /** Downloads one collection with its snippets. */
  exportCollection: (collection: Collection) => Promise<void>
  /** Opens the file picker, then the import preview. */
  chooseImportFile: () => void
  /** Opens the import preview for a file (e.g. dropped onto the window). */
  importFile: (file: File) => void
}

export const BackupContext = createContext<BackupApi | null>(null)

export function useBackup(): BackupApi {
  const context = useContext(BackupContext)
  if (!context) throw new Error('useBackup must be used within <BackupProvider>')
  return context
}
