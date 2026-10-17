import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { parseSnippetQuery, patchSnippetQuery, type SnippetQuery } from '../lib/select-snippets'

/** The current list query, read from and written to the URL (replacing, so history isn't spammed). */
export function useSnippetQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseSnippetQuery(params), [params])

  const update = useCallback(
    (patch: Partial<SnippetQuery>) =>
      setParams((current) => patchSnippetQuery(current, patch), { replace: true, preventScrollReset: true }),
    [setParams],
  )

  return { query, update }
}
