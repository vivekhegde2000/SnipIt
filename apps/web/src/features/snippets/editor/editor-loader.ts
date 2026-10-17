/**
 * Code-split entry points for the snippet editor. The same loader functions are used by
 * `React.lazy` and by the idle-time preload, so the browser fetches each chunk only once.
 */
export const loadSnippetEditorDialog = () => import('./SnippetEditorDialog')
export const loadCodeEditor = () => import('./CodeEditor')

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

/**
 * Warms the editor chunks once the browser is idle, so the first "New snippet" opens instantly
 * without putting them on the critical path. Returns a cancel function.
 */
export function preloadEditorWhenIdle(): () => void {
  const win = window as IdleWindow
  const preload = () => {
    void loadSnippetEditorDialog().catch(() => undefined)
    void loadCodeEditor().catch(() => undefined)
  }

  if (win.requestIdleCallback && win.cancelIdleCallback) {
    const handle = win.requestIdleCallback(preload, { timeout: 4000 })
    return () => win.cancelIdleCallback?.(handle)
  }
  const timer = window.setTimeout(preload, 1500)
  return () => window.clearTimeout(timer)
}
