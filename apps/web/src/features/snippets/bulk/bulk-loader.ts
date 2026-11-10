/**
 * The bulk action bar (menus, tag editor) is a lazy chunk: it is only needed once something is
 * selected. The library page warms it after first paint (see `runAfterPaint`), so the bar appears
 * instantly on the first selection. The module promise is cached; a failed load (offline on a
 * first visit) is retried next time.
 */
let promise: Promise<typeof import('./BulkActionBar')> | null = null

export function loadBulkActionBar() {
  promise ??= import('./BulkActionBar').catch((error: unknown) => {
    promise = null
    throw error
  })
  return promise
}

export function preloadBulkActionBar(): void {
  loadBulkActionBar().catch(() => {})
}
