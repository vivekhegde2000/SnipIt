/**
 * Languages a snippet can be tagged with. `id` is the persisted value and must never change;
 * `label` is for display; `extension` is used when downloading a snippet as a file.
 * Order is the order shown in pickers (common first).
 */
export const LANGUAGES = [
  { id: 'plaintext', label: 'Plain text', extension: 'txt' },
  { id: 'markdown', label: 'Markdown', extension: 'md' },
  { id: 'bash', label: 'Bash / Shell', extension: 'sh' },
  { id: 'powershell', label: 'PowerShell', extension: 'ps1' },
  { id: 'sql', label: 'SQL', extension: 'sql' },
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'typescript', label: 'TypeScript', extension: 'ts' },
  { id: 'jsx', label: 'JSX', extension: 'jsx' },
  { id: 'tsx', label: 'TSX', extension: 'tsx' },
  { id: 'json', label: 'JSON', extension: 'json' },
  { id: 'yaml', label: 'YAML', extension: 'yaml' },
  { id: 'html', label: 'HTML', extension: 'html' },
  { id: 'css', label: 'CSS', extension: 'css' },
  { id: 'python', label: 'Python', extension: 'py' },
  { id: 'java', label: 'Java', extension: 'java' },
  { id: 'csharp', label: 'C#', extension: 'cs' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
  { id: 'c', label: 'C', extension: 'c' },
  { id: 'go', label: 'Go', extension: 'go' },
  { id: 'rust', label: 'Rust', extension: 'rs' },
  { id: 'php', label: 'PHP', extension: 'php' },
  { id: 'ruby', label: 'Ruby', extension: 'rb' },
  { id: 'kotlin', label: 'Kotlin', extension: 'kt' },
  { id: 'swift', label: 'Swift', extension: 'swift' },
  { id: 'dockerfile', label: 'Dockerfile', extension: 'dockerfile' },
  { id: 'xml', label: 'XML', extension: 'xml' },
  { id: 'toml', label: 'TOML', extension: 'toml' },
] as const

export type LanguageId = (typeof LANGUAGES)[number]['id']

export const LANGUAGE_IDS = LANGUAGES.map((language) => language.id) as [LanguageId, ...LanguageId[]]

export const DEFAULT_LANGUAGE: LanguageId = 'plaintext'

const BY_ID = new Map<string, (typeof LANGUAGES)[number]>(LANGUAGES.map((l) => [l.id, l]))

export function getLanguageLabel(id: string): string {
  return BY_ID.get(id)?.label ?? id
}

/** File extension (without dot) for downloads; `txt` for unknown ids. */
export function getLanguageExtension(id: string): string {
  return BY_ID.get(id)?.extension ?? 'txt'
}

export function isLanguageId(value: string): value is LanguageId {
  return BY_ID.has(value)
}
