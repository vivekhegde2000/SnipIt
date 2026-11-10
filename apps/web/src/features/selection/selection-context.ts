import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import type { SelectionState, SelectionStore } from './selection-store'

export const SelectionContext = createContext<SelectionStore | null>(null)

export function useSelectionStore(): SelectionStore {
  const store = useContext(SelectionContext)
  if (!store) throw new Error('useSelectionStore must be used within <SelectionProvider>')
  return store
}

/** The whole selection. Re-renders on every change — use in the action bar, not in cards. */
export function useSelection(): SelectionState {
  const store = useSelectionStore()
  return useSyncExternalStore(store.subscribe, store.getState)
}

/** Whether one snippet is selected. Re-renders only when *that* flag flips. */
export function useIsSelected(id: string): boolean {
  const store = useSelectionStore()
  return useSyncExternalStore(store.subscribe, () => store.getState().ids.has(id))
}

/**
 * Publishes the ids a page lists (in display order) for Shift-range and Select all. Cleared on
 * unmount, so `Mod+A` does nothing on pages without a selectable list.
 */
export function useSelectableOrder(ids: readonly string[]): void {
  const store = useSelectionStore()
  useEffect(() => {
    store.setOrder(ids)
    return () => store.setOrder([])
  }, [store, ids])
}

/** Whether selection mode is on. Re-renders only when the mode flips. */
export function useSelectionActive(): boolean {
  const store = useSelectionStore()
  return useSyncExternalStore(store.subscribe, () => store.getState().active)
}
