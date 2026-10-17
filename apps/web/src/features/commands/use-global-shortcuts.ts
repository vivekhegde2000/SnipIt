import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { focusSearchInput } from '@/features/snippets/search-input'
import { focusAdjacentCard, isEditableTarget, isOverlayOpen } from '@/lib/keyboard'
import { isModKey } from '@/lib/platform'

/** Max delay between the two keys of a "G then X" sequence. */
const SEQUENCE_TIMEOUT_MS = 1200

const GO_TO: Record<string, string> = {
  a: '/',
  f: '/favorites',
  r: '/recent',
  c: '/collections',
  s: '/settings',
}

type GlobalShortcutHandlers = {
  togglePalette: () => void
  openPalette: () => void
  openShortcuts: () => void
  newSnippet: () => void
}

/**
 * App-wide keyboard shortcuts (see `shortcuts.ts` for the reference). Single-key shortcuts are
 * ignored while typing or while a dialog/menu is open; `Mod+K` works everywhere.
 */
export function useGlobalShortcuts(handlers: GlobalShortcutHandlers): void {
  const navigate = useNavigate()
  // Latest handlers without re-subscribing the listener on every render.
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    let sequenceStartedAt = 0

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      const { togglePalette, openPalette, openShortcuts, newSnippet } = latest.current
      const key = event.key.toLowerCase()

      if (isModKey(event) && !event.altKey && !event.shiftKey && key === 'k') {
        event.preventDefault()
        togglePalette()
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isEditableTarget(event.target) || isOverlayOpen()) {
        sequenceStartedAt = 0
        return
      }

      if (sequenceStartedAt && performance.now() - sequenceStartedAt < SEQUENCE_TIMEOUT_MS) {
        sequenceStartedAt = 0
        const to = GO_TO[key]
        if (to) {
          event.preventDefault()
          navigate(to)
        }
        return
      }
      sequenceStartedAt = 0

      switch (event.key) {
        case '/':
          event.preventDefault()
          if (!focusSearchInput()) openPalette()
          return
        case '?':
          event.preventDefault()
          openShortcuts()
          return
        case 'n':
          event.preventDefault()
          newSnippet()
          return
        case 'g':
          sequenceStartedAt = performance.now()
          return
        case 'j':
          if (focusAdjacentCard(1)) event.preventDefault()
          return
        case 'k':
          if (focusAdjacentCard(-1)) event.preventDefault()
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])
}
