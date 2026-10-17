import { highlightTree } from '@lezer/highlight'
import type { LanguageId } from '@snipit/shared'
import { languageOf, loadLanguage } from './code-languages'
import { syntaxHighlighter } from './syntax-highlighter'

/** A run of text with its syntax class (`null` = plain). */
export type HighlightSegment = { text: string; className: string | null }

/**
 * Tokenises `code` with the same grammar and class mapping as the editor.
 * Returns `null` for plain text. This module is loaded lazily (it pulls in CodeMirror's parser
 * core), so it never weighs on the initial bundle.
 */
export async function highlightCode(code: string, language: LanguageId): Promise<HighlightSegment[] | null> {
  const pending = loadLanguage(language)
  if (!pending) return null

  const tree = languageOf(await pending).parser.parse(code)
  const segments: HighlightSegment[] = []
  let position = 0

  highlightTree(tree, syntaxHighlighter, (from, to, classes) => {
    if (from > position) segments.push({ text: code.slice(position, from), className: null })
    segments.push({ text: code.slice(from, to), className: classes })
    position = to
  })
  if (position < code.length) segments.push({ text: code.slice(position), className: null })

  return segments
}
