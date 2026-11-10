type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

/**
 * Runs `task` once the page has loaded, the current content has been painted and the main thread
 * is idle — for warming lazy chunks without competing with first content for bandwidth or CPU.
 * Returns a cancel function (use it as an effect cleanup).
 */
export function runAfterPaint(task: () => void): () => void {
  const win = window as IdleWindow
  let cancelScheduled = () => {}

  const whenIdle = () => {
    if (win.requestIdleCallback && win.cancelIdleCallback) {
      const handle = win.requestIdleCallback(task, { timeout: 2000 })
      cancelScheduled = () => win.cancelIdleCallback?.(handle)
    } else {
      const timer = window.setTimeout(task, 300)
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
