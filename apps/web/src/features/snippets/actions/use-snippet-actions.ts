import { useMemo } from 'react'
import { toast } from 'sonner'
import { getLanguageExtension, type Snippet } from '@snipit/shared'
import { getErrorMessage, snippetRepository } from '@/db'
import { shareSnippet } from '@/features/share/share-snippet'
import { downloadTextFile, slugify } from '@/lib/download'
import { useOpenSnippetDetail } from '../detail/use-snippet-detail'
import { useSnippetEditor } from '../editor/snippet-editor-context'
import { useTemplateFill } from '../template/template-fill-context'

export type SnippetActions = {
  /**
   * Copies the content; resolves `true` on success (drives the button's "Copied" state).
   * A template opens the fill-in form first and resolves `false`.
   */
  copy: (snippet: Snippet) => Promise<boolean>
  /** Copies a template's raw content, placeholders included. */
  copyAsIs: (snippet: Snippet) => Promise<boolean>
  toggleFavorite: (snippet: Snippet) => Promise<void>
  duplicate: (snippet: Snippet) => Promise<void>
  moveToCollection: (snippet: Snippet, collection: { id: string; name: string } | null) => Promise<void>
  download: (snippet: Snippet) => void
  /** Copies a share link (or opens the system share sheet on touch devices). */
  share: (snippet: Snippet) => Promise<void>
  /** Moves the snippet to the Trash, with an Undo toast. */
  remove: (snippet: Snippet) => Promise<void>
  edit: (snippet: Snippet) => void
  open: (snippet: Snippet) => void
}

/**
 * Every snippet action in one place, so cards, the detail view, the command palette and keyboard
 * shortcuts behave identically (same toasts, same error handling, same undo).
 */
export function useSnippetActions(): SnippetActions {
  // All are stable, so the returned object is too (cards stay memoised).
  const { openEdit } = useSnippetEditor()
  const openDetail = useOpenSnippetDetail()
  const templates = useTemplateFill()

  return useMemo<SnippetActions>(
    () => ({
      copy: (snippet) => templates.copy(snippet),
      copyAsIs: (snippet) => templates.copyAsIs(snippet),

      async toggleFavorite(snippet) {
        try {
          await snippetRepository.toggleFavorite(snippet.id)
        } catch (error) {
          toast.error(getErrorMessage(error))
        }
      },

      async duplicate(snippet) {
        try {
          const copy = await snippetRepository.duplicate(snippet.id)
          toast.success('Snippet duplicated', {
            action: { label: 'Edit', onClick: () => openEdit(copy.id) },
          })
        } catch (error) {
          toast.error(getErrorMessage(error))
        }
      },

      async moveToCollection(snippet, collection) {
        if ((collection?.id ?? null) === snippet.collectionId) return
        try {
          await snippetRepository.update(snippet.id, { collectionId: collection?.id ?? null })
          toast.success(collection ? `Moved to ${collection.name}` : 'Removed from collection')
        } catch (error) {
          toast.error(getErrorMessage(error))
        }
      },

      download(snippet) {
        downloadTextFile(
          `${slugify(snippet.title)}.${getLanguageExtension(snippet.language)}`,
          snippet.content,
        )
      },

      share: (snippet) => shareSnippet(snippet),

      async remove(snippet) {
        try {
          await snippetRepository.softDelete(snippet.id)
          toast(`Moved “${snippet.title}” to the Trash`, {
            duration: 6000,
            action: {
              label: 'Undo',
              onClick: () => {
                snippetRepository
                  .restore(snippet.id)
                  .catch((error: unknown) => toast.error(getErrorMessage(error)))
              },
            },
          })
        } catch (error) {
          toast.error(getErrorMessage(error))
        }
      },

      edit: (snippet) => openEdit(snippet.id),
      open: (snippet) => openDetail(snippet.id),
    }),
    [openEdit, openDetail, templates],
  )
}
