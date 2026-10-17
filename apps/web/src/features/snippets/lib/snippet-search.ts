import Fuse, { type IFuseOptions, type RangeTuple } from 'fuse.js'
import type { Snippet } from '@snipit/shared'

/**
 * Content beyond this is not searched. Fuzzy matching scans the whole text per word, and content
 * has the lowest weight anyway — this keeps typing fast with large libraries and long snippets.
 */
const CONTENT_SEARCH_CHARS = 1500
/** At most this many words are combined (AND) per query. */
const MAX_TERMS = 6
/**
 * Terms shorter than this match exactly (substring). One typo in a 3-letter word is a 33% error,
 * so fuzzy matching short terms ("git", "sql") only adds noise.
 */
const FUZZY_MIN_LENGTH = 4

const OPTIONS: IFuseOptions<Snippet> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'tags', weight: 0.25 },
    { name: 'description', weight: 0.15 },
    { name: 'content', weight: 0.1, getFn: (snippet) => snippet.content.slice(0, CONTENT_SEARCH_CHARS) },
  ],
  threshold: 0.35, // tolerant of typos ("comit" → commit, "pyhton" → python) without matching noise
  ignoreLocation: true, // a match anywhere in the text counts equally
  ignoreDiacritics: true,
  includeScore: true,
  includeMatches: true,
}

export type SearchHit = {
  /** 0 = perfect … 1 = no match (Fuse convention). */
  score: number
  /** Matched ranges in the title, for highlighting. */
  titleMatches?: ReadonlyArray<RangeTuple>
}

export type SearchHits = ReadonlyMap<string, SearchHit>

type NormalizedEntry = { id: string; title: string; tags: string; description: string; content: string }

export type SnippetIndex = {
  fuse: Fuse<Snippet>
  /** Lower-cased fields, computed once per index, for exact short-term matching. */
  entries: NormalizedEntry[]
}

export function createSnippetIndex(snippets: readonly Snippet[]): SnippetIndex {
  return {
    fuse: new Fuse(snippets, OPTIONS),
    entries: snippets.map((s) => ({
      id: s.id,
      title: s.title.toLowerCase(),
      tags: s.tags.join(' '),
      description: s.description.toLowerCase(),
      content: s.content.slice(0, CONTENT_SEARCH_CHARS).toLowerCase(),
    })),
  }
}

type TermHits = Map<string, { score: number; ranges: RangeTuple[] }>

/** Exact (substring) matches for a short term, scored by where they occur. */
function exactTermHits(index: SnippetIndex, term: string): TermHits {
  const needle = term.toLowerCase()
  const hits: TermHits = new Map()
  for (const entry of index.entries) {
    const titleAt = entry.title.indexOf(needle)
    if (titleAt !== -1) {
      hits.set(entry.id, {
        score: titleAt === 0 ? 0 : 0.05,
        ranges: [[titleAt, titleAt + needle.length - 1]],
      })
    } else if (entry.tags.includes(needle)) {
      hits.set(entry.id, { score: 0.15, ranges: [] })
    } else if (entry.description.includes(needle)) {
      hits.set(entry.id, { score: 0.25, ranges: [] })
    } else if (entry.content.includes(needle)) {
      hits.set(entry.id, { score: 0.35, ranges: [] })
    }
  }
  return hits
}

/** Fuzzy matches for a longer term. */
function fuzzyTermHits(index: SnippetIndex, term: string): TermHits {
  const hits: TermHits = new Map()
  for (const result of index.fuse.search(term)) {
    const titleRanges = (result.matches ?? [])
      .filter((match) => match.key === 'title')
      .flatMap((match) => match.indices.filter(([start, end]) => end - start + 1 >= 2))
    hits.set(result.item.id, { score: result.score ?? 1, ranges: [...titleRanges] })
  }
  return hits
}

/**
 * Search where every word must match (AND): "git undo" finds snippets matching both. Short words
 * match exactly, longer ones fuzzily. Scores are averaged; title ranges are merged for highlighting.
 */
export function searchSnippets(index: SnippetIndex, query: string): SearchHits {
  const terms = query.trim().split(/\s+/).filter(Boolean).slice(0, MAX_TERMS)
  let combined: Map<string, { scoreSum: number; ranges: RangeTuple[] }> | null = null

  for (const term of terms) {
    const termHits = term.length < FUZZY_MIN_LENGTH ? exactTermHits(index, term) : fuzzyTermHits(index, term)

    if (combined === null) {
      combined = new Map([...termHits].map(([id, hit]) => [id, { scoreSum: hit.score, ranges: hit.ranges }]))
      continue
    }
    for (const [id, entry] of combined) {
      const hit = termHits.get(id)
      if (!hit) combined.delete(id)
      else
        combined.set(id, { scoreSum: entry.scoreSum + hit.score, ranges: [...entry.ranges, ...hit.ranges] })
    }
  }

  const hits = new Map<string, SearchHit>()
  for (const [id, entry] of combined ?? []) {
    hits.set(id, {
      score: entry.scoreSum / terms.length,
      titleMatches: entry.ranges.length ? entry.ranges : undefined,
    })
  }
  return hits
}
