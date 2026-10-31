import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { purgeExpiredTrash } from '@/db'
import { useLibrary } from '@/features/library/library-context'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'
import { requestPersistentStorage } from '@/lib/persistent-storage'

/** Delay before the Trash clean-up, so it never competes with the first screen. */
const PURGE_DELAY_MS = 3000

/**
 * One-off app behaviours that react to launch state:
 * - `/?new=1` (the "New snippet" shortcut in the installed app's launcher menu) opens the editor;
 * - once the library has content worth protecting, ask the browser not to evict it;
 * - shortly after start, snippets that have been in the Trash too long are removed for good.
 */
export function AppLaunchEffects() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Best-effort housekeeping: a failure just means it is retried on the next start.
      purgeExpiredTrash().catch(() => undefined)
    }, PURGE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const { counts } = useLibrary()
  const [params, setParams] = useSearchParams()
  const { openNew } = useNewSnippet()

  const wantsNewSnippet = params.get('new') === '1'
  useEffect(() => {
    if (!wantsNewSnippet) return
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('new')
        return next
      },
      { replace: true },
    )
    openNew()
  }, [wantsNewSnippet, setParams, openNew])

  const hasData = counts.all > 0
  useEffect(() => {
    if (hasData) void requestPersistentStorage()
  }, [hasData])

  return null
}
