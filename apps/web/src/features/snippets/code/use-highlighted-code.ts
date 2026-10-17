import { useEffect, useState } from 'react'
import type { LanguageId } from '@snipit/shared'
import type { HighlightSegment } from './highlight-code'

/** Longer inputs are shown as plain text: highlighting them would cost more than it helps. */
const MAX_HIGHLIGHT_CHARS = 20_000
/** Small LRU so re-mounted cards (filter/sort changes) don't re-parse. */
const CACHE_LIMIT = 400

type Segments = HighlightSegment[] | null

const cache = new Map<string, Segments>()
let highlighter: Promise<typeof import('./highlight-code')> | null = null

const loadHighlighter = () => {
  highlighter ??= import('./highlight-code').catch((error: unknown) => {
    highlighter = null // allow a retry later
    throw error
  })
  return highlighter
}

function remember(key: string, segments: Segments) {
  cache.delete(key)
  cache.set(key, segments)
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

/**
 * Syntax segments for `code`, or `null` while loading / for plain text. Callers render the raw
 * text until segments arrive, so content is visible immediately and never shifts.
 */
export function useHighlightedCode(code: string, language: LanguageId): Segments {
  const key = `${language}\u0000${code}`
  const skip = language === 'plaintext' || code.length > MAX_HIGHLIGHT_CHARS
  const [result, setResult] = useState<{ key: string; segments: Segments } | null>(null)

  useEffect(() => {
    if (skip || cache.has(key)) return
    let cancelled = false
    loadHighlighter()
      .then((module) => module.highlightCode(code, language))
      .then((segments) => {
        remember(key, segments)
        if (!cancelled) setResult({ key, segments })
      })
      .catch(() => {
        // Progressive enhancement: plain text is a fine fallback (e.g. grammar unavailable offline).
      })
    return () => {
      cancelled = true
    }
  }, [key, skip, code, language])

  if (skip) return null
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  return result?.key === key ? result.segments : null
}
