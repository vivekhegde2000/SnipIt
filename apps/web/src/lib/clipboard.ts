/**
 * Copies text to the clipboard. Returns `true` on success.
 *
 * Uses the async Clipboard API where available (HTTPS / localhost) and falls back to a hidden
 * textarea + `execCommand('copy')` for plain-HTTP origins (e.g. testing on a phone via LAN IP)
 * and older browsers.
 */
export async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied or document not focused — try the legacy path.
    }
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const previouslyFocused = document.activeElement as HTMLElement | null
  // Inside a modal, Radix traps focus: the helper must live in the dialog or it can't be selected.
  const container = previouslyFocused?.closest('[role="dialog"], [role="alertdialog"]') ?? document.body

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('aria-hidden', 'true')
  Object.assign(textarea.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
  })
  container.append(textarea)

  const selection = document.getSelection()
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  textarea.select()
  textarea.setSelectionRange(0, text.length)
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }

  textarea.remove()
  if (previousRange && selection) {
    selection.removeAllRanges()
    selection.addRange(previousRange)
  }
  previouslyFocused?.focus({ preventScroll: true })
  return copied
}
