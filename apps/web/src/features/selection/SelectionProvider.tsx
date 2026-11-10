import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { isEditableTarget, isOverlayOpen } from '@/lib/keyboard'
import { isModKey } from '@/lib/platform'
import { SelectionContext } from './selection-context'
import { createSelectionStore } from './selection-store'

/**
 * One selection for the app shell. It survives search and filter changes (they only touch the
 * query string), and is cleared when you move to another page — a selection always belongs to
 * the page it was made on.
 *
 * Keyboard: `Mod+A` selects everything listed on a selectable page, `Esc` leaves selection mode.
 * Both are ignored while typing or while a dialog or menu is open.
 */
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createSelectionStore)
  const { pathname } = useLocation()

  useEffect(() => {
    store.clear()
  }, [pathname, store])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      if (isEditableTarget(event.target) || isOverlayOpen()) return
      const isSelectAll =
        isModKey(event) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'a'
      if (isSelectAll && store.getOrder().length > 0) {
        event.preventDefault()
        store.selectAll()
      } else if (event.key === 'Escape' && store.getState().active) {
        event.preventDefault()
        store.clear()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [store])

  return <SelectionContext value={store}>{children}</SelectionContext>
}
