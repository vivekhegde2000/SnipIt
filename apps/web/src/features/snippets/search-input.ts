/** DOM id of the library search box (target of the `/` shortcut). */
export const SEARCH_INPUT_ID = 'snippet-search'

/** Focuses and selects the search box if the current page has one. Returns whether it did. */
export function focusSearchInput(): boolean {
  const input = document.getElementById(SEARCH_INPUT_ID)
  if (!(input instanceof HTMLInputElement)) return false
  input.focus()
  input.select()
  return true
}
