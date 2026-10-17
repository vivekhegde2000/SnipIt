import { StreamLanguage, type StreamParser } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import type { LanguageId } from '@snipit/shared'

type LanguageLoader = () => Promise<Extension>

const legacy = (parser: StreamParser<unknown>): Extension => StreamLanguage.define(parser)

/**
 * Grammar loaders for each supported language. Each one is its own lazy chunk, so only the
 * languages a user actually opens are downloaded. `null` = no highlighting (plain text).
 *
 * Direct imports (instead of `@codemirror/language-data`) keep the build free of 100+ unused
 * language chunks and let Vite pre-bundle exactly these packages in dev.
 */
const LOADERS: Record<LanguageId, LanguageLoader | null> = {
  plaintext: null,
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  bash: () => import('@codemirror/legacy-modes/mode/shell').then((m) => legacy(m.shell)),
  powershell: () => import('@codemirror/legacy-modes/mode/powershell').then((m) => legacy(m.powerShell)),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  typescript: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  jsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  tsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true, typescript: true })),
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  yaml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  csharp: () => import('@codemirror/legacy-modes/mode/clike').then((m) => legacy(m.csharp)),
  cpp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  c: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  go: () => import('@codemirror/lang-go').then((m) => m.go()),
  rust: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  php: () => import('@codemirror/lang-php').then((m) => m.php()),
  ruby: () => import('@codemirror/legacy-modes/mode/ruby').then((m) => legacy(m.ruby)),
  kotlin: () => import('@codemirror/legacy-modes/mode/clike').then((m) => legacy(m.kotlin)),
  swift: () => import('@codemirror/legacy-modes/mode/swift').then((m) => legacy(m.swift)),
  dockerfile: () => import('@codemirror/legacy-modes/mode/dockerfile').then((m) => legacy(m.dockerFile)),
  xml: () => import('@codemirror/lang-xml').then((m) => m.xml()),
  toml: () => import('@codemirror/legacy-modes/mode/toml').then((m) => legacy(m.toml)),
}

const cache = new Map<LanguageId, Promise<Extension>>()

/** Loads (once) the editor extension for `language`; resolves `null` for plain text. */
export function loadLanguage(language: LanguageId): Promise<Extension> | null {
  const loader = LOADERS[language]
  if (!loader) return null

  let pending = cache.get(language)
  if (!pending) {
    pending = loader().catch((error: unknown) => {
      cache.delete(language) // allow a retry (e.g. after coming back online)
      throw error
    })
    cache.set(language, pending)
  }
  return pending
}
