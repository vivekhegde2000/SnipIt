/** Validation limits shared by the client and (later) the API. */
export const LIMITS = {
  titleMax: 120,
  contentMax: 100_000,
  descriptionMax: 500,
  tagMax: 32,
  tagsPerSnippetMax: 20,
  collectionNameMax: 60,
  collectionIconMax: 16,
  idMax: 64,
} as const

/**
 * Deleted snippets stay in the Trash this long, then are removed for good. Deleted collections
 * are kept for the same time (they have no Trash view; Undo covers accidental deletes).
 */
export const TRASH_RETENTION_DAYS = 30
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000

/** Palette keys a collection may use. Rendering maps each key to theme-aware colours. */
export const COLLECTION_COLORS = [
  'indigo',
  'sky',
  'emerald',
  'lime',
  'amber',
  'orange',
  'rose',
  'fuchsia',
  'violet',
  'slate',
] as const

export type CollectionColor = (typeof COLLECTION_COLORS)[number]

export const DEFAULT_COLLECTION_COLOR: CollectionColor = 'indigo'
