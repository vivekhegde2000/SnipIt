/**
 * Languages a snippet can be tagged with. `id` is the persisted value and must never change;
 * `label` is for display. Order is the order shown in pickers (common first).
 */
export const LANGUAGES = [
  { id: 'plaintext', label: 'Plain text' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'bash', label: 'Bash / Shell' },
  { id: 'powershell', label: 'PowerShell' },
  { id: 'sql', label: 'SQL' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'jsx', label: 'JSX' },
  { id: 'tsx', label: 'TSX' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'csharp', label: 'C#' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'swift', label: 'Swift' },
  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'xml', label: 'XML' },
  { id: 'toml', label: 'TOML' },
] as const

export type LanguageId = (typeof LANGUAGES)[number]['id']

export const LANGUAGE_IDS = LANGUAGES.map((language) => language.id) as [LanguageId, ...LanguageId[]]

export const DEFAULT_LANGUAGE: LanguageId = 'plaintext'

const LABELS = new Map<string, string>(LANGUAGES.map((l) => [l.id, l.label]))

export function getLanguageLabel(id: string): string {
  return LABELS.get(id) ?? id
}

export function isLanguageId(value: string): value is LanguageId {
  return LABELS.has(value)
}
