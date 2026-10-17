/**
 * Code-split entry point for CodeMirror (~140 KB gzipped). `React.lazy` and the preloads share this
 * loader, so the module is fetched at most once.
 */
export const loadCodeEditor = () => import('./CodeEditor')

let preloaded = false

/** Starts fetching the editor (idempotent). Call on intent: hover/focus of a "New" or edit trigger. */
export function preloadCodeEditor(): void {
  if (preloaded) return
  preloaded = true
  loadCodeEditor().catch(() => {
    preloaded = false // allow a retry later (e.g. offline during first visit)
  })
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

/**
 * Warms the editor right after the app has painted, so the first "New snippet" opens instantly
 * without putting CodeMirror on the critical path. Returns a cancel function.
 */
export function preloadCodeEditorAfterPaint(): () => void {
  const win = window as IdleWindow
  if (win.requestIdleCallback && win.cancelIdleCallback) {
    const handle = win.requestIdleCallback(preloadCodeEditor, { timeout: 1200 })
    return () => win.cancelIdleCallback?.(handle)
  }
  const timer = window.setTimeout(preloadCodeEditor, 300)
  return () => window.clearTimeout(timer)
}
