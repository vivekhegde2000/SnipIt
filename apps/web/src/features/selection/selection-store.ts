/**
 * Multi-select state for snippet lists (library views and the Trash).
 *
 * A tiny external store rather than React state: every card subscribes to *its own* "selected"
 * flag (`useSyncExternalStore`), so toggling one card re-renders that card and the action bar,
 * not the whole grid.
 */
export type SelectionState = {
  /** Selection mode is on (checkboxes shown, clicking a card selects it). */
  active: boolean
  ids: ReadonlySet<string>
}

export type SelectionStore = {
  getState: () => SelectionState
  subscribe: (listener: () => void) => () => void
  /** The ids currently listed, in display order. Used for Shift-range and "Select all". */
  setOrder: (ids: readonly string[]) => void
  getOrder: () => readonly string[]
  /** Turns selection mode on without selecting anything (the toolbar's "Select" button). */
  start: () => void
  /** Toggles one id. With `range`, selects everything between the last toggled id and this one. */
  toggle: (id: string, options?: { range?: boolean }) => void
  /** Adds every listed id. */
  selectAll: () => void
  /** Drops ids (e.g. snippets that were just deleted). Selection mode stays on. */
  remove: (ids: Iterable<string>) => void
  /** Empties the selection and leaves selection mode. */
  clear: () => void
}

const EMPTY: SelectionState = { active: false, ids: new Set() }

export function createSelectionStore(): SelectionStore {
  let state = EMPTY
  let order: readonly string[] = []
  /** Last id toggled without Shift: one end of a Shift-range. */
  let anchor: string | null = null
  const listeners = new Set<() => void>()

  const set = (next: SelectionState) => {
    if (next === state) return
    state = next
    for (const listener of listeners) listener()
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setOrder(ids) {
      order = ids
    },
    getOrder: () => order,
    start() {
      if (!state.active) set({ active: true, ids: state.ids })
    },
    toggle(id, { range = false } = {}) {
      const ids = new Set(state.ids)
      const from = anchor === null ? -1 : order.indexOf(anchor)
      const to = order.indexOf(id)
      if (range && from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from]
        for (const rangeId of order.slice(start, end + 1)) ids.add(rangeId)
      } else {
        if (ids.has(id)) ids.delete(id)
        else ids.add(id)
        anchor = id
      }
      set({ active: true, ids })
    },
    selectAll() {
      set({ active: true, ids: new Set([...state.ids, ...order]) })
    },
    remove(removed) {
      const ids = new Set(state.ids)
      let changed = false
      for (const id of removed) changed = ids.delete(id) || changed
      if (changed) set({ active: state.active, ids })
    },
    clear() {
      anchor = null
      set(EMPTY)
    },
  }
}
