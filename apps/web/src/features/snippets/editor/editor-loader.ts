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
 * Warms the editor once the page has loaded, the current content has been painted and the main
 * thread is idle, so the first "New snippet" opens instantly without CodeMirror competing with
 * the first paint for bandwidth or CPU. Intent (hover/focus/touch on a trigger) still preloads
 * earlier. Returns a cancel function.
 */
export function preloadCodeEditorAfterPaint(): () => void {
  const win = window as IdleWindow
  let cancelScheduled = () => {}

  const whenIdle = () => {
    if (win.requestIdleCallback && win.cancelIdleCallback) {
      const handle = win.requestIdleCallback(preloadCodeEditor, { timeout: 2000 })
      cancelScheduled = () => win.cancelIdleCallback?.(handle)
    } else {
      const timer = window.setTimeout(preloadCodeEditor, 300)
      cancelScheduled = () => window.clearTimeout(timer)
    }
  }

  // Idle callbacks can run before the next frame is painted; the second animation frame starts
  // only after the frame with the freshly rendered content has been presented.
  const schedule = () => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(whenIdle)
    })
    cancelScheduled = () => cancelAnimationFrame(frame)
  }

  if (document.readyState === 'complete') {
    schedule()
    return () => cancelScheduled()
  }
  window.addEventListener('load', schedule, { once: true })
  return () => {
    window.removeEventListener('load', schedule)
    cancelScheduled()
  }
}
