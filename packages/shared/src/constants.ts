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
