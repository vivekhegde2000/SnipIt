import { normalizeTag, type Snippet } from '@snipit/shared'

export type SnippetView =
  { kind: 'all' } | { kind: 'favorites' } | { kind: 'recent' } | { kind: 'collection'; collectionId: string }

export type SnippetFilters = {
  /** Snippet must have every one of these tags. */
  tags: readonly string[]
}

/** How many snippets the Recent view shows. */
export const RECENT_LIMIT = 50

const TAGS_PARAM = 'tags'

/** Reads `?tags=a,b` into normalized, de-duplicated tags. */
export function parseTagParam(params: URLSearchParams): string[] {
  const raw = params.get(TAGS_PARAM)
  if (!raw) return []
  return [...new Set(raw.split(',').map(normalizeTag).filter(Boolean))]
}

/** Link to the library filtered by `tags` (empty = no filter). */
export function tagFilterHref(tags: readonly string[]): string {
  if (tags.length === 0) return '/'
  const params = new URLSearchParams({ [TAGS_PARAM]: tags.join(',') })
  return `/?${params.toString()}`
}

const lastActivity = (s: Snippet) => Math.max(s.updatedAt, s.lastCopiedAt ?? 0)

/**
 * Picks and orders the snippets for a view. Input is assumed to be active snippets ordered by
 * `updatedAt` desc (as provided by the library), which is kept as the default order.
 */
export function selectSnippets(
  snippets: readonly Snippet[],
  view: SnippetView,
  filters: SnippetFilters,
): Snippet[] {
  let result: Snippet[]

  switch (view.kind) {
    case 'all':
      result = [...snippets]
      break
    case 'favorites':
      result = snippets.filter((s) => s.isFavorite)
      break
    case 'collection':
      result = snippets.filter((s) => s.collectionId === view.collectionId)
      break
    case 'recent':
      result = [...snippets].sort((a, b) => lastActivity(b) - lastActivity(a)).slice(0, RECENT_LIMIT)
      break
  }

  if (filters.tags.length > 0) {
    result = result.filter((s) => filters.tags.every((tag) => s.tags.includes(tag)))
  }

  return result
}
