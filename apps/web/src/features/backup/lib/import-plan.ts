import type { Collection, Snippet } from '@snipit/shared'
import type { ParsedBackup } from './backup-format'

export type ImportMode = 'merge' | 'replace'

export type ImportSummary = {
  snippets: { added: number; updated: number; unchanged: number }
  collections: { added: number; updated: number; merged: number; unchanged: number }
  invalid: { collections: number; snippets: number }
}

export type ImportPlan = {
  mode: ImportMode
  collections: Collection[]
  snippets: Snippet[]
  summary: ImportSummary
}

type LocalData = { collections: readonly Collection[]; snippets: readonly Snippet[] }

const nameKey = (name: string) => name.trim().toLocaleLowerCase()

/** Makes `name` unique against `taken` by appending " (2)", " (3)"… */
function uniqueName(name: string, taken: Set<string>): string {
  if (!taken.has(nameKey(name))) return name
  for (let n = 2; ; n++) {
    const candidate = `${name} (${n})`
    if (!taken.has(nameKey(candidate))) return candidate
  }
}

/**
 * Decides exactly what an import will write. Pure, so the preview and the real import (which
 * re-plans inside its transaction against fresh data) always agree.
 *
 * Merge:
 * - Same id, both active → the more recently edited version wins; copy stats keep the higher values.
 * - Same id but deleted locally → restored from the backup (restoring is what imports are for).
 * - A backup collection whose name matches an existing collection is merged into it (no duplicates).
 * - Snippets pointing at a collection that exists neither in the file nor locally become unsorted.
 *
 * Replace: everything local is removed and the backup is written as-is (names de-duplicated).
 */
export function planImport(local: LocalData, backup: ParsedBackup, mode: ImportMode): ImportPlan {
  const summary: ImportSummary = {
    snippets: { added: 0, updated: 0, unchanged: 0 },
    collections: { added: 0, updated: 0, merged: 0, unchanged: 0 },
    invalid: backup.invalid,
  }
  const collectionsOut: Collection[] = []
  const snippetsOut: Snippet[] = []
  /** Backup collection id → id it will have locally after the import. */
  const collectionIdMap = new Map<string, string>()

  if (mode === 'replace') {
    const taken = new Set<string>()
    for (const collection of backup.collections) {
      const name = uniqueName(collection.name, taken)
      taken.add(nameKey(name))
      collectionsOut.push({ ...collection, name })
      collectionIdMap.set(collection.id, collection.id)
      summary.collections.added++
    }
    for (const snippet of backup.snippets) {
      const collectionId = snippet.collectionId ? (collectionIdMap.get(snippet.collectionId) ?? null) : null
      snippetsOut.push({ ...snippet, collectionId })
      summary.snippets.added++
    }
    return { mode, collections: collectionsOut, snippets: snippetsOut, summary }
  }

  // ---- Merge: collections --------------------------------------------------------------------
  const localCollectionsById = new Map(local.collections.map((c) => [c.id, c]))
  const activeByName = new Map(
    local.collections.filter((c) => c.deletedAt === null).map((c) => [nameKey(c.name), c]),
  )
  const takenNames = new Set(activeByName.keys())

  for (const incoming of backup.collections) {
    const existing = localCollectionsById.get(incoming.id)

    if (existing && existing.deletedAt === null) {
      collectionIdMap.set(incoming.id, existing.id)
      if (incoming.updatedAt > existing.updatedAt) {
        // Keep names unique if the incoming rename collides with another collection.
        takenNames.delete(nameKey(existing.name))
        const name = uniqueName(incoming.name, takenNames)
        takenNames.add(nameKey(name))
        collectionsOut.push({ ...incoming, name, deletedAt: null })
        summary.collections.updated++
      } else {
        summary.collections.unchanged++
      }
      continue
    }

    const sameName = activeByName.get(nameKey(incoming.name))
    if (sameName) {
      collectionIdMap.set(incoming.id, sameName.id)
      summary.collections.merged++
      continue
    }

    // New collection (or one deleted locally → restored).
    const name = uniqueName(incoming.name, takenNames)
    takenNames.add(nameKey(name))
    const restored: Collection = { ...incoming, name, deletedAt: null }
    collectionsOut.push(restored)
    activeByName.set(nameKey(name), restored)
    collectionIdMap.set(incoming.id, incoming.id)
    summary.collections.added++
  }

  const usableCollectionIds = new Set([
    ...local.collections.filter((c) => c.deletedAt === null).map((c) => c.id),
    ...collectionsOut.map((c) => c.id),
  ])
  const resolveCollection = (id: string | null) => {
    if (!id) return null
    const mapped = collectionIdMap.get(id) ?? id
    return usableCollectionIds.has(mapped) ? mapped : null
  }

  // ---- Merge: snippets -----------------------------------------------------------------------
  const localSnippetsById = new Map(local.snippets.map((s) => [s.id, s]))

  for (const incoming of backup.snippets) {
    const collectionId = resolveCollection(incoming.collectionId)
    const existing = localSnippetsById.get(incoming.id)

    if (!existing || existing.deletedAt !== null) {
      snippetsOut.push({ ...incoming, collectionId, deletedAt: null })
      summary.snippets.added++
      continue
    }
    if (incoming.updatedAt > existing.updatedAt) {
      snippetsOut.push({
        ...incoming,
        collectionId,
        deletedAt: null,
        copyCount: Math.max(incoming.copyCount, existing.copyCount),
        lastCopiedAt: Math.max(incoming.lastCopiedAt ?? 0, existing.lastCopiedAt ?? 0) || null,
      })
      summary.snippets.updated++
    } else {
      summary.snippets.unchanged++
    }
  }

  return { mode, collections: collectionsOut, snippets: snippetsOut, summary }
}

/** True when applying the plan would change nothing. */
export function isNoopPlan(plan: ImportPlan): boolean {
  return plan.mode === 'merge' && plan.collections.length === 0 && plan.snippets.length === 0
}
