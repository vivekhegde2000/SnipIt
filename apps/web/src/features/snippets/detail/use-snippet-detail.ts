import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'

/** URL parameter holding the id of the snippet whose detail view is open. */
const PARAM = 'snippet'

type DetailState = { snippetDetail?: boolean } | null

/**
 * Stable `open(id)` for the detail view (`?snippet=<id>`), safe to use in every card.
 *
 * It reads the current URL at call time instead of subscribing to the location, so components
 * using it don't re-render on every URL change (search typing, filters…).
 */
export function useOpenSnippetDetail(): (snippetId: string) => void {
  const navigate = useNavigate()
  return useCallback(
    (snippetId: string) => {
      const { pathname, search } = window.location
      const params = new URLSearchParams(search)
      // Switching between snippets replaces the entry, so Back returns to the list.
      const alreadyOpen = params.has(PARAM)
      params.set(PARAM, snippetId)
      navigate(
        { pathname, search: params.toString() },
        { replace: alreadyOpen, state: { snippetDetail: true } satisfies DetailState },
      )
    },
    [navigate],
  )
}

/**
 * The detail view's route state, for the component that renders it. The view lives in the URL so
 * it can be linked, and the browser Back button (or Android back gesture) closes it naturally.
 */
export function useSnippetDetailRoute(): { openId: string | null; close: () => void } {
  const navigate = useNavigate()
  const location = useLocation()
  const openId = useMemo(() => new URLSearchParams(location.search).get(PARAM), [location.search])

  const close = useCallback(() => {
    if ((location.state as DetailState)?.snippetDetail) {
      navigate(-1) // we pushed this entry when opening — pop it
      return
    }
    // Opened from a link / reload: just drop the parameter.
    const params = new URLSearchParams(location.search)
    params.delete(PARAM)
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
  }, [navigate, location.pathname, location.search, location.state])

  return { openId, close }
}
