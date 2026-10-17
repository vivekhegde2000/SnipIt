import { createContext, useContext } from 'react'
import type { SnippetFormValues } from '@snipit/shared'

export type SnippetEditorRequest =
  { mode: 'create'; defaults?: Partial<SnippetFormValues> } | { mode: 'edit'; snippetId: string }

export type SnippetEditorApi = {
  /** Opens the editor for a new snippet, optionally pre-filled (e.g. current collection). */
  openCreate: (defaults?: Partial<SnippetFormValues>) => void
  openEdit: (snippetId: string) => void
}

export const SnippetEditorContext = createContext<SnippetEditorApi | null>(null)

export function useSnippetEditor(): SnippetEditorApi {
  const context = useContext(SnippetEditorContext)
  if (!context) throw new Error('useSnippetEditor must be used within <SnippetEditorProvider>')
  return context
}
