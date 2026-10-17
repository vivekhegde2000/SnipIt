import type { LanguageId } from '@snipit/shared'

/**
 * Maps our persisted language ids to `@codemirror/language-data` names. Grammars are loaded on
 * demand, so only the languages actually used are ever downloaded. `null` = no highlighting.
 */
export const CODEMIRROR_LANGUAGE_NAMES: Record<LanguageId, string | null> = {
  plaintext: null,
  markdown: 'Markdown',
  bash: 'Shell',
  powershell: 'PowerShell',
  sql: 'SQL',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  json: 'JSON',
  yaml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  rust: 'Rust',
  php: 'PHP',
  ruby: 'Ruby',
  kotlin: 'Kotlin',
  swift: 'Swift',
  dockerfile: 'Dockerfile',
  xml: 'XML',
  toml: 'TOML',
}
