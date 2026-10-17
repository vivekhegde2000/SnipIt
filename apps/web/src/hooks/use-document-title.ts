import { useEffect } from 'react'

const APP_NAME = 'SnipIt'

/** Sets `document.title` to "<title> · SnipIt" (or just "SnipIt"). */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
