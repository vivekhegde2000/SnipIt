import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Snippet } from '@snipit/shared'
import { useLibrary } from '@/features/library/library-context'
import { SnippetDetailSheet } from './SnippetDetailSheet'
import { useSnippetDetailRoute } from './use-snippet-detail'

/**
 * Renders the detail sheet for `?snippet=<id>`. Keeps the last snippet mounted while the sheet
 * animates out, and cleans up the URL if the id doesn't exist.
 */
export function SnippetDetailHost() {
  const { openId, close } = useSnippetDetailRoute()
  const { snippets, collectionsById, isLoading } = useLibrary()
  const snippet = openId ? snippets.find((s) => s.id === openId) : undefined

  // "Remember the last value" during render (React-sanctioned pattern) for the exit animation.
  const [shown, setShown] = useState<Snippet | undefined>(snippet)
  if (snippet && snippet !== shown) setShown(snippet)

  const isMissing = openId !== null && !isLoading && !snippet
  const wasShowing = shown?.id === openId
  // `close` changes identity with the location; make sure we only close once per id
  // (closing twice would navigate back two history entries).
  const closedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!isMissing || closedFor.current === openId) return
    closedFor.current = openId
    // Deleted while open → the Undo toast already explains it; a bad link gets a message.
    if (!wasShowing) toast.error('That snippet no longer exists.')
    close()
  }, [isMissing, wasShowing, close, openId])

  if (!shown) return null

  return (
    <SnippetDetailSheet
      snippet={shown}
      collection={shown.collectionId ? collectionsById.get(shown.collectionId) : undefined}
      open={snippet !== undefined}
      onClose={close}
    />
  )
}
