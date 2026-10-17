import { isLanguageId, normalizeTag, type LanguageId, type Snippet } from '@snipit/shared'
import type { SearchHits } from './snippet-search'

export type SnippetView =
  { kind: 'all' } | { kind: 'favorites' } | { kind: 'recent' } | { kind: 'collection'; collectionId: string }

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'recent', label: 'Recently used' },
  { value: 'copied', label: 'Most copied' },
  { value: 'created', label: 'Newest first' },
  { value: 'az', label: 'Title A–Z' },
] as const

export type SortKey = (typeof SORT_OPTIONS)[number]['value']

/** Everything that narrows or orders a snippet list; serialised in the URL. */
export type SnippetQuery = {
  q: string
  /** Snippet must have every one of these tags. */
  tags: string[]
  language: LanguageId | null
  /** Only meaningful on the "All" view (collection pages are already scoped). */
  collectionId: string | null
  favorites: boolean
  /** `null` = the view's default. */
  sort: SortKey | null
}

/** How many snippets the Recent view shows. */
export const RECENT_LIMIT = 50

const PARAMS = {
  q: 'q',
  tags: 'tags',
  language: 'lang',
  collectionId: 'col',
  favorites: 'fav',
  sort: 'sort',
} as const
const SORT_KEYS = new Set<string>(SORT_OPTIONS.map((option) => option.value))

/* -------------------------------------------------------------------------------------------------
 * URL <-> query
 * -----------------------------------------------------------------------------------------------*/

/** Reads `?tags=a,b` into normalized, de-duplicated tags. */
export function parseTagParam(params: URLSearchParams): string[] {
  const raw = params.get(PARAMS.tags)
  if (!raw) return []
  return [...new Set(raw.split(',').map(normalizeTag).filter(Boolean))]
}

/** Parses (and sanitises) the query from URL params; unknown values fall back to defaults. */
export function parseSnippetQuery(params: URLSearchParams): SnippetQuery {
  const language = params.get(PARAMS.language)
  const sort = params.get(PARAMS.sort)
  return {
    q: params.get(PARAMS.q) ?? '',
    tags: parseTagParam(params),
    language: language && isLanguageId(language) ? language : null,
    collectionId: params.get(PARAMS.collectionId) || null,
    favorites: params.get(PARAMS.favorites) === '1',
    sort: sort && SORT_KEYS.has(sort) ? (sort as SortKey) : null,
  }
}

/** Returns new params with `patch` applied; unrelated params (e.g. `?snippet=`) are preserved. */
export function patchSnippetQuery(params: URLSearchParams, patch: Partial<SnippetQuery>): URLSearchParams {
  const next = new URLSearchParams(params)
  const set = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key))
  if (patch.q !== undefined) set(PARAMS.q, patch.q.trim() ? patch.q : null)
  if (patch.tags !== undefined) set(PARAMS.tags, patch.tags.length ? patch.tags.join(',') : null)
  if (patch.language !== undefined) set(PARAMS.language, patch.language)
  if (patch.collectionId !== undefined) set(PARAMS.collectionId, patch.collectionId)
  if (patch.favorites !== undefined) set(PARAMS.favorites, patch.favorites ? '1' : null)
  if (patch.sort !== undefined) set(PARAMS.sort, patch.sort)
  return next
}

/** Link to the library filtered by `tags` (empty = no filter). */
export function tagFilterHref(tags: readonly string[]): string {
  const params = patchSnippetQuery(new URLSearchParams(), { tags: [...tags] })
  const search = params.toString()
  return search ? `/?${search}` : '/'
}

/** Patch that removes every filter (search included); sort is kept. */
export const CLEARED_FILTERS: Partial<SnippetQuery> = {
  q: '',
  tags: [],
  language: null,
  collectionId: null,
  favorites: false,
}

export function countActiveFilters(query: SnippetQuery): number {
  return (
    query.tags.length +
    Number(query.language !== null) +
    Number(query.collectionId !== null) +
    Number(query.favorites)
  )
}

/* -------------------------------------------------------------------------------------------------
 * Selection
 * -----------------------------------------------------------------------------------------------*/

const lastActivity = (s: Snippet) => Math.max(s.updatedAt, s.lastCopiedAt ?? 0)
const titleCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** The sort actually applied: explicit choice, else relevance while searching, else the view default. */
export function effectiveSort(view: SnippetView, query: SnippetQuery, isSearching: boolean): SortKey {
  if (query.sort && (query.sort !== 'relevance' || isSearching)) return query.sort
  if (isSearching) return 'relevance'
  return view.kind === 'recent' ? 'recent' : 'updated'
}

function comparator(sort: SortKey, hits: SearchHits | null): (a: Snippet, b: Snippet) => number {
  switch (sort) {
    case 'relevance':
      return (a, b) =>
        (hits?.get(a.id)?.score ?? 1) - (hits?.get(b.id)?.score ?? 1) || b.updatedAt - a.updatedAt
    case 'recent':
      return (a, b) => lastActivity(b) - lastActivity(a)
    case 'copied':
      return (a, b) => b.copyCount - a.copyCount || lastActivity(b) - lastActivity(a)
    case 'created':
      return (a, b) => b.createdAt - a.createdAt
    case 'az':
      return (a, b) => titleCollator.compare(a.title, b.title)
    case 'updated':
      return (a, b) => b.updatedAt - a.updatedAt
  }
}

/**
 * View → filters → search → sort. Input is the library's active snippets.
 * `hits` is `null` when not searching.
 */
export function selectSnippets(
  snippets: readonly Snippet[],
  view: SnippetView,
  query: SnippetQuery,
  hits: SearchHits | null,
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
      result = [...snippets].sort(comparator('recent', null)).slice(0, RECENT_LIMIT)
      break
  }

  const { tags, language, collectionId, favorites } = query
  if (tags.length) result = result.filter((s) => tags.every((tag) => s.tags.includes(tag)))
  if (language) result = result.filter((s) => s.language === language)
  if (collectionId && view.kind === 'all') result = result.filter((s) => s.collectionId === collectionId)
  if (favorites) result = result.filter((s) => s.isFavorite)
  if (hits) result = result.filter((s) => hits.has(s.id))

  return result.sort(comparator(effectiveSort(view, query, hits !== null), hits))
}
