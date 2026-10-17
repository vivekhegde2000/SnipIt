import { LIMITS } from './constants.ts'

/** Characters allowed inside a tag (after lower-casing). Keeps `c#`, `c++`, `node.js`, `ci/cd`. */
const DISALLOWED_TAG_CHARS = /[^a-z0-9\-_.+#/]/g

/**
 * Canonical form of a tag: trimmed, lower-case, no leading `#`, whitespace collapsed to `-`,
 * no repeated or edge dashes, and capped at {@link LIMITS.tagMax} characters.
 * Returns an empty string when nothing usable remains.
 *
 * @example normalizeTag('  My Tag ') === 'my-tag'
 * @example normalizeTag('#Node.JS') === 'node.js'
 */
export function normalizeTag(raw: string): string {
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(DISALLOWED_TAG_CHARS, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.tagMax)
}

/** Normalizes, drops empties, de-duplicates (first occurrence wins) and caps the list length. */
export function normalizeTags(raw: readonly string[]): string[] {
  const unique = new Set<string>()
  for (const value of raw) {
    const tag = normalizeTag(value)
    if (tag) unique.add(tag)
    if (unique.size >= LIMITS.tagsPerSnippetMax) break
  }
  return [...unique]
}
