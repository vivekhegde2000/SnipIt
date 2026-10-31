import { safeStorage } from '@/lib/storage'

/**
 * The values last used to fill each template, so repeating a copy is one keystroke. Stored on
 * this device only (like the snippets themselves), most recently used last, capped in size.
 */
const STORAGE_KEY = 'snipit:template-values'
const MAX_SNIPPETS = 100
const MAX_VALUE_LENGTH = 2000

type TemplateValues = Record<string, string>
type Store = Record<string, TemplateValues>

function read(): Store {
  try {
    const parsed: unknown = JSON.parse(safeStorage.get(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Store) : {}
  } catch {
    return {}
  }
}

/** Last values used for this snippet's template (only string values are trusted). */
export function recallTemplateValues(snippetId: string | undefined): TemplateValues {
  if (!snippetId) return {}
  const saved = read()[snippetId]
  if (!saved || typeof saved !== 'object') return {}
  return Object.fromEntries(Object.entries(saved).filter(([, value]) => typeof value === 'string'))
}

export function rememberTemplateValues(snippetId: string | undefined, values: TemplateValues): void {
  if (!snippetId) return
  const store = read()
  delete store[snippetId] // re-insert last = most recently used
  store[snippetId] = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== '')
      .map(([name, value]) => [name, value.slice(0, MAX_VALUE_LENGTH)]),
  )
  const ids = Object.keys(store)
  for (const id of ids.slice(0, Math.max(0, ids.length - MAX_SNIPPETS))) delete store[id]
  safeStorage.set(STORAGE_KEY, JSON.stringify(store))
}

/** Used by "Delete all data": remembered values are part of the user's data. */
export function forgetAllTemplateValues(): void {
  safeStorage.remove(STORAGE_KEY)
}
