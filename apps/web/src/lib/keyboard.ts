/** True when the event comes from somewhere the user is typing (inputs, editors, contenteditable). */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color'].includes(type)
  }
  return target.closest('[contenteditable="true"], .cm-editor') !== null
}

/**
 * True while a modal surface (dialog, sheet, alert, menu, listbox) is open. Surfaces that are only
 * animating out (`data-state="closed"`) don't count, so shortcuts work again immediately.
 */
export function isOverlayOpen(): boolean {
  return (
    document.querySelector(
      [
        '[role="dialog"]:not([data-state="closed"])',
        '[role="alertdialog"]:not([data-state="closed"])',
        '[role="menu"]:not([data-state="closed"])',
        '[role="listbox"]:not([data-state="closed"])',
      ].join(', '),
    ) !== null
  )
}

/** Selector for the element that represents a snippet card in keyboard navigation. */
export const CARD_FOCUS_SELECTOR = '[data-card-primary]'

/**
 * Moves focus `delta` cards forward/back (DOM order = visual order in our grid; pass the column
 * count to move by rows). With nothing focused yet, forward focuses the first card, back the last.
 */
export function focusAdjacentCard(delta: number): boolean {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(CARD_FOCUS_SELECTOR))
  if (cards.length === 0) return false
  const currentCard = document.activeElement?.closest('[data-snippet-card]')
  const index = cards.findIndex((card) => card.closest('[data-snippet-card]') === currentCard)
  const next = index === -1 ? (delta > 0 ? 0 : cards.length - 1) : index + delta
  const target = cards[Math.min(cards.length - 1, Math.max(0, next))]
  target?.focus()
  target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  return target !== undefined
}
