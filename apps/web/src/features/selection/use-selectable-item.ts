import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { isEditableTarget } from '@/lib/keyboard'
import { isModKey } from '@/lib/platform'
import { useIsSelected, useSelectionActive, useSelectionStore } from './selection-context'

/** Press-and-hold this long on a touch screen to start selecting. */
const LONG_PRESS_MS = 450
/** A finger that moves further than this is scrolling, not pressing. */
const LONG_PRESS_SLOP_PX = 10

export type SelectableItem = {
  isSelected: boolean
  /** Selection mode is on: a click selects instead of opening. */
  selectionActive: boolean
  /** Toggles this item (Shift = range from the last toggled item). */
  toggle: (options?: { range?: boolean }) => void
  /**
   * For the item's main click target. Returns `true` when the click was used for selection
   * (selection mode, Shift/Ctrl/⌘-click, or the click that ends a long press), so the caller
   * should not run its normal action.
   */
  handleClick: (event: MouseEvent) => boolean
  /** `X` toggles the focused item. Returns `true` when handled. */
  handleKeyDown: (event: KeyboardEvent) => boolean
  /** Spread on the item's root: press-and-hold on touch screens starts selecting. */
  pressProps: {
    onPointerDown: (event: PointerEvent) => void
    onPointerMove: (event: PointerEvent) => void
    onPointerUp: () => void
    onPointerCancel: () => void
    onContextMenu: (event: MouseEvent) => void
  }
}

/** Selection behaviour shared by snippet cards, list rows and Trash rows. */
export function useSelectableItem(id: string): SelectableItem {
  const store = useSelectionStore()
  const isSelected = useIsSelected(id)
  const selectionActive = useSelectionActive()
  const press = useRef<{ timer: number; x: number; y: number } | null>(null)
  /** The click that follows a completed long press must not also open the snippet. */
  const swallowClick = useRef(false)

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer)
    press.current = null
  }
  useEffect(() => cancelPress, [])

  const toggle: SelectableItem['toggle'] = (options) => store.toggle(id, options)

  return {
    isSelected,
    selectionActive,
    toggle,

    handleClick(event) {
      if (swallowClick.current) {
        swallowClick.current = false
        event.preventDefault()
        return true
      }
      if (selectionActive || event.shiftKey || isModKey(event)) {
        event.preventDefault()
        toggle({ range: event.shiftKey })
        return true
      }
      return false
    },

    handleKeyDown(event) {
      if (event.key.toLowerCase() !== 'x' || event.altKey || event.ctrlKey || event.metaKey) return false
      if (event.defaultPrevented || isEditableTarget(event.target)) return false
      if ((event.target as HTMLElement).closest('[role="menu"]')) return false
      event.preventDefault()
      event.stopPropagation()
      toggle({ range: event.shiftKey })
      return true
    },

    pressProps: {
      onPointerDown(event) {
        if (event.pointerType !== 'touch' || !event.isPrimary) return
        // Buttons inside the item (Copy, ⋯, star) keep their own tap behaviour.
        if ((event.target as HTMLElement).closest('button:not([data-card-primary]), a, [role="checkbox"]')) {
          return
        }
        cancelPress()
        swallowClick.current = false
        const { clientX: x, clientY: y } = event
        const timer = window.setTimeout(() => {
          press.current = null
          swallowClick.current = true
          navigator.vibrate?.(10)
          toggle()
        }, LONG_PRESS_MS)
        press.current = { timer, x, y }
      },
      onPointerMove(event) {
        const start = press.current
        if (!start) return
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_SLOP_PX) cancelPress()
      },
      onPointerUp: cancelPress,
      onPointerCancel: cancelPress,
      onContextMenu(event) {
        // Android fires `contextmenu` on a long press; ours already selected the item.
        if (press.current || swallowClick.current) event.preventDefault()
      },
    },
  }
}
