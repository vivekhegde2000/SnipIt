import type { Collection } from '@snipit/shared'
import { db, settingsRepository } from '@/db'
import { downloadTextFile, slugify } from '@/lib/download'
import { backupFileName, createBackup, type ParsedBackup } from './backup-format'
import { planImport, type ImportMode, type ImportPlan, type ImportSummary } from './import-plan'

/** Every record on this device, including soft-deleted ones (import needs them to resolve ids). */
async function readLocal() {
  const [collections, snippets] = await Promise.all([db.collections.toArray(), db.snippets.toArray()])
  return { collections, snippets }
}

/** Plans an import against the current data, for the preview. Writes nothing. */
export async function previewImport(backup: ParsedBackup, mode: ImportMode): Promise<ImportPlan> {
  return planImport(await readLocal(), backup, mode)
}

/**
 * Applies a backup in a single transaction (all or nothing). The plan is recomputed inside the
 * transaction against fresh data, so a preview left open while data changed can't write stale
 * results.
 */
export async function applyImport(backup: ParsedBackup, mode: ImportMode): Promise<ImportSummary> {
  return db.transaction('rw', db.collections, db.snippets, async () => {
    const plan = planImport(await readLocal(), backup, mode)
    if (mode === 'replace') {
      await db.snippets.clear()
      await db.collections.clear()
    }
    await db.collections.bulkPut(plan.collections)
    await db.snippets.bulkPut(plan.snippets)
    return plan.summary
  })
}

export type ExportResult = { snippets: number; collections: number }

/** Downloads a backup of the whole library and records the time as the last backup. */
export async function exportLibrary(): Promise<ExportResult> {
  const { collections, snippets } = await readLocal()
  const backup = createBackup(collections, snippets)
  downloadTextFile(backupFileName(), JSON.stringify(backup, null, 2), 'application/json')
  await settingsRepository.update({ lastBackupAt: Date.now() })
  return { snippets: backup.snippets.length, collections: backup.collections.length }
}

/** Downloads one collection and its snippets (for sharing; not counted as a full backup). */
export async function exportCollection(collection: Collection): Promise<ExportResult> {
  const snippets = await db.snippets.where('collectionId').equals(collection.id).toArray()
  const backup = createBackup([collection], snippets)
  downloadTextFile(
    backupFileName(new Date(), slugify(collection.name, 'collection')),
    JSON.stringify(backup, null, 2),
    'application/json',
  )
  return { snippets: backup.snippets.length, collections: 1 }
}
