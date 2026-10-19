import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  backupEnvelopeSchema,
  collectionSchema,
  snippetSchema,
  type Backup,
  type Collection,
  type Snippet,
} from '@snipit/shared'

/** Refuse anything bigger: a real library is a few MB at most; this guards against wrong files. */
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024

export type BackupErrorCode = 'TOO_LARGE' | 'NOT_JSON' | 'NOT_SNIPIT' | 'NEWER_VERSION'

/** Expected, user-presentable problem with a backup file. */
export class BackupError extends Error {
  readonly code: BackupErrorCode

  constructor(code: BackupErrorCode, message: string) {
    super(message)
    this.name = 'BackupError'
    this.code = code
  }
}

export type ParsedBackup = {
  exportedAt: string
  collections: Collection[]
  snippets: Snippet[]
  /** Records that failed validation and will be skipped. */
  invalid: { collections: number; snippets: number }
}

/* -------------------------------------------------------------------------------------------------
 * Export
 * -----------------------------------------------------------------------------------------------*/

/** Builds a backup of active (non-deleted) records. Tombstones are never exported. */
export function createBackup(
  collections: readonly Collection[],
  snippets: readonly Snippet[],
  now = new Date(),
): Backup {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    collections: collections.filter((c) => c.deletedAt === null),
    snippets: snippets.filter((s) => s.deletedAt === null),
  }
}

/** `snipit-backup-2026-10-19.json`, or `snipit-git-commands-2026-10-19.json` for one collection. */
export function backupFileName(now = new Date(), scopeSlug?: string): string {
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('-')
  return `snipit-${scopeSlug ?? 'backup'}-${date}.json`
}

/* -------------------------------------------------------------------------------------------------
 * Import
 * -----------------------------------------------------------------------------------------------*/

/** Upgrades older backup formats to the current shape. Only v1 exists today. */
function migrate(envelope: { version: number; collections: unknown[]; snippets: unknown[] }) {
  return envelope
}

/** When the same id appears twice in a file, keep the most recently updated record. */
function dedupeById<T extends { id: string; updatedAt: number }>(records: T[]): T[] {
  const byId = new Map<string, T>()
  for (const record of records) {
    const existing = byId.get(record.id)
    if (!existing || record.updatedAt > existing.updatedAt) byId.set(record.id, record)
  }
  return [...byId.values()]
}

/**
 * Parses and validates a backup file's text. The envelope must be valid; individual records are
 * validated one by one, so a single bad record is skipped (and counted) instead of failing the file.
 * Deleted records in the file are ignored.
 */
export function parseBackup(text: string): ParsedBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupError('NOT_JSON', 'This file is not valid JSON. Choose a SnipIt backup (.json) file.')
  }

  const app = (json as { app?: unknown } | null)?.app
  const version = (json as { version?: unknown } | null)?.version
  if (app !== BACKUP_APP_ID) {
    throw new BackupError('NOT_SNIPIT', 'This file is not a SnipIt backup.')
  }
  if (typeof version === 'number' && version > BACKUP_VERSION) {
    throw new BackupError(
      'NEWER_VERSION',
      'This backup was made by a newer version of SnipIt. Reload the app to update, then try again.',
    )
  }

  const envelope = backupEnvelopeSchema.safeParse(json)
  if (!envelope.success)
    throw new BackupError('NOT_SNIPIT', 'This SnipIt backup is damaged and cannot be read.')

  const { collections: rawCollections, snippets: rawSnippets } = migrate(envelope.data)
  const invalid = { collections: 0, snippets: 0 }

  const collections: Collection[] = []
  for (const raw of rawCollections) {
    const result = collectionSchema.safeParse(raw)
    if (!result.success) invalid.collections++
    else if (result.data.deletedAt === null) collections.push(result.data)
  }

  const snippets: Snippet[] = []
  for (const raw of rawSnippets) {
    const result = snippetSchema.safeParse(raw)
    if (!result.success) invalid.snippets++
    else if (result.data.deletedAt === null) snippets.push(result.data)
  }

  return {
    exportedAt: envelope.data.exportedAt,
    collections: dedupeById(collections),
    snippets: dedupeById(snippets),
    invalid,
  }
}

/** Reads a user-chosen file and parses it (size-checked first). */
export async function readBackupFile(file: File): Promise<ParsedBackup> {
  if (file.size > MAX_BACKUP_BYTES) {
    throw new BackupError('TOO_LARGE', 'This file is too large to be a SnipIt backup (max 25 MB).')
  }
  return parseBackup(await file.text())
}
