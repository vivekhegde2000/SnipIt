import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SnippetFormValues } from '@snipit/shared'
import { useSettings } from '@/features/settings/use-settings'
import { preloadCodeEditor, preloadCodeEditorAfterPaint } from './editor-loader'
import { SnippetEditorDialog } from './SnippetEditorDialog'
import {
  SnippetEditorContext,
  type SnippetEditorApi,
  type SnippetEditorRequest,
} from './snippet-editor-context'

type EditorSession = {
  /** Increments per open, so every session mounts a fresh form. */
  id: number
  request: SnippetEditorRequest
  open: boolean
}

/**
 * Owns the single snippet editor dialog.
 *
 * Performance: the dialog and form ship in the main bundle so opening is instant; only CodeMirror
 * is code-split, and it is preloaded right after first paint (and again on hover/focus intent).
 * The session stays mounted after closing so the exit animation can play; the next open replaces
 * it with a new key.
 */
export function SnippetEditorProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<EditorSession | null>(null)
  // Read here (always mounted, so already resolved) rather than inside the freshly mounted dialog.
  const { defaultLanguage } = useSettings()

  useEffect(() => preloadCodeEditorAfterPaint(), [])

  const open = useCallback((request: SnippetEditorRequest) => {
    setSession((current) => ({ id: (current?.id ?? 0) + 1, request, open: true }))
  }, [])

  const close = useCallback(() => {
    setSession((current) => (current ? { ...current, open: false } : current))
  }, [])

  const api = useMemo<SnippetEditorApi>(
    () => ({
      openCreate: (defaults?: Partial<SnippetFormValues>) => open({ mode: 'create', defaults }),
      openEdit: (snippetId: string) => open({ mode: 'edit', snippetId }),
      preload: preloadCodeEditor,
    }),
    [open],
  )

  return (
    <SnippetEditorContext value={api}>
      {children}
      {session && (
        <SnippetEditorDialog
          key={session.id}
          request={session.request}
          open={session.open}
          onClose={close}
          defaultLanguage={defaultLanguage}
        />
      )}
    </SnippetEditorContext>
  )
}
