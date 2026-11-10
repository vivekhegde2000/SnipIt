import { runAfterPaint } from '@/lib/after-paint'

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

/**
 * Warms the editor once the page has loaded, the current content has been painted and the main
 * thread is idle, so the first "New snippet" opens instantly without CodeMirror competing with
 * the first paint for bandwidth or CPU. Intent (hover/focus/touch on a trigger) still preloads
 * earlier. Returns a cancel function.
 */
export function preloadCodeEditorAfterPaint(): () => void {
  return runAfterPaint(preloadCodeEditor)
}
