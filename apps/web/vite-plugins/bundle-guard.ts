import type { Plugin } from 'vite'

type ChunkInfo = { fileName: string; imports: readonly string[]; moduleIds: readonly string[] }

/** Returns one import cycle between chunks (`a → b → a`), or `undefined` if there is none. */
export function findChunkCycle(chunks: readonly ChunkInfo[]): string[] | undefined {
  const imports = new Map(chunks.map((chunk) => [chunk.fileName, chunk.imports]))
  const done = new Set<string>()
  const path: string[] = []

  const visit = (file: string): string[] | undefined => {
    if (done.has(file)) return undefined
    const start = path.indexOf(file)
    if (start !== -1) return [...path.slice(start), file]
    path.push(file)
    for (const next of imports.get(file) ?? []) {
      const cycle = visit(next)
      if (cycle) return cycle
    }
    path.pop()
    done.add(file)
    return undefined
  }

  for (const file of imports.keys()) {
    const cycle = visit(file)
    if (cycle) return cycle
  }
  return undefined
}

/**
 * Returns module ids that point to the same file with different casing (`d:/…` and `D:/…`). On
 * case-insensitive file systems that file is bundled twice; for React that means two copies and
 * "Cannot read properties of null (reading 'useCallback')" on start.
 */
export function findCaseDuplicates(chunks: readonly ChunkInfo[]): string[][] {
  const byKey = new Map<string, Set<string>>()
  for (const chunk of chunks) {
    for (const id of chunk.moduleIds) {
      if (id.startsWith('\0')) continue // virtual modules
      const key = id.replaceAll('\\', '/').toLowerCase()
      const ids = byKey.get(key) ?? new Set<string>()
      ids.add(id)
      byKey.set(key, ids)
    }
  }
  return [...byKey.values()].filter((ids) => ids.size > 1).map((ids) => [...ids])
}

/**
 * Fails the build instead of shipping a bundle that would show a blank page:
 * - chunks that statically import each other in a cycle (a module can run before its dependencies)
 * - the same file bundled under ids that differ only in casing (duplicate module instances)
 */
export function bundleGuard(): Plugin {
  return {
    name: 'snipit:bundle-guard',
    apply: 'build',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((output) => output.type === 'chunk')

      const cycle = findChunkCycle(chunks)
      if (cycle) this.error(`Circular imports between chunks: ${cycle.join(' → ')}`)

      const duplicates = findCaseDuplicates(chunks)
      if (duplicates.length > 0) {
        const sample = duplicates
          .slice(0, 3)
          .map((ids) => ids.join('  ≠  '))
          .join('\n  ')
        this.error(
          `${duplicates.length} module(s) were bundled twice under differently cased paths, e.g.\n  ${sample}\n` +
            'Check that the build runs from the canonical path (drive letter casing on Windows).',
        )
      }
    },
  }
}
