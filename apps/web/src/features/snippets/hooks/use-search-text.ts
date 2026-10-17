import { useEffect, useState } from 'react'

const COMMIT_DELAY_MS = 250

/**
 * Local state for the search box: results update on every keystroke (from this state), while the
 * URL is only written after a short pause.
 *
 * URL changes made elsewhere (Clear, Back, a tag link) replace the text — but the echo of our own
 * commit must not, or keystrokes typed while the URL update is in flight would be lost.
 */
export function useSearchText(
  urlValue: string,
  commit: (value: string) => void,
): [string, (value: string) => void] {
  const [text, setText] = useState(urlValue)
  const [syncedUrlValue, setSyncedUrlValue] = useState(urlValue)
  const [lastCommitted, setLastCommitted] = useState<string | null>(null)

  // "Adjust state while rendering" pattern (no effect, no extra paint).
  if (urlValue !== syncedUrlValue) {
    setSyncedUrlValue(urlValue)
    if (urlValue !== lastCommitted) setText(urlValue)
  }

  useEffect(() => {
    if (text === urlValue) return
    const timer = window.setTimeout(() => {
      setLastCommitted(text)
      commit(text)
    }, COMMIT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [text, urlValue, commit])

  return [text, setText]
}
