import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useLibrary } from '@/features/library/library-context'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'
import { requestPersistentStorage } from '@/lib/persistent-storage'

/**
 * One-off app behaviours that react to launch state:
 * - `/?new=1` (the "New snippet" shortcut in the installed app's launcher menu) opens the editor;
 * - once the library has content worth protecting, ask the browser not to evict it.
 */
export function AppLaunchEffects() {
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
