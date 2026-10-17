import { useMemo } from 'react'
import { toast } from 'sonner'
import { getLanguageExtension, type Snippet } from '@snipit/shared'
import { getErrorMessage, snippetRepository } from '@/db'
import { copyText } from '@/lib/clipboard'
import { downloadTextFile, slugify } from '@/lib/download'
import { useOpenSnippetDetail } from '../detail/use-snippet-detail'
import { useSnippetEditor } from '../editor/snippet-editor-context'

export type SnippetActions = {
  /** Copies the content; resolves `true` on success (drives the button's "Copied" state). */
  copy: (snippet: Snippet) => Promise<boolean>
  toggleFavorite: (snippet: Snippet) => Promise<void>
  duplicate: (snippet: Snippet) => Promise<void>
  moveToCollection: (snippet: Snippet, collection: { id: string; name: string } | null) => Promise<void>
  download: (snippet: Snippet) => void
  /** Soft-deletes with an Undo toast. */
  remove: (snippet: Snippet) => Promise<void>
  edit: (snippet: Snippet) => void
  open: (snippet: Snippet) => void
}

/**
 * Every snippet action in one place, so cards, the detail view, the command palette and keyboard
 * shortcuts behave identically (same toasts, same error handling, same undo).
 */
export function useSnippetActions(): SnippetActions {
  // Both are stable, so the returned object is too (cards stay memoised).
  const { openEdit } = useSnippetEditor()
  const openDetail = useOpenSnippetDetail()

  return useMemo<SnippetActions>(
    () => ({
      async copy(snippet) {
        const copied = await copyText(snippet.content)
        if (!copied) {
          toast.error('Could not copy. Your browser blocked clipboard access.')
          return false
        }
        // Usage stats are best-effort; never fail the copy because of them.
        snippetRepository.recordCopy(snippet.id).catch(() => undefined)
        // A fixed id replaces the previous toast instead of stacking one per copy.
        toast.success(`Copied “${snippet.title}”`, { id: 'snippet-copied' })
        return true
      },

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

      async remove(snippet) {
        try {
          await snippetRepository.softDelete(snippet.id)
          toast(`Deleted “${snippet.title}”`, {
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
    [openEdit, openDetail],
  )
}
