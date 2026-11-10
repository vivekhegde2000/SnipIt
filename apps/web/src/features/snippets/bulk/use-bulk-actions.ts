import { useMemo } from 'react'
import { toast } from 'sonner'
import { LIMITS, type Snippet } from '@snipit/shared'
import { getErrorMessage, snippetRepository, type BulkSnippetChange, type BulkUpdateResult } from '@/db'
import { useBackup } from '@/features/backup/backup-context'
import { useSelectionStore } from '@/features/selection/selection-context'

const UNDO_TOAST_MS = 6000

export const pluralSnippets = (count: number) => `${count.toLocaleString()} snippet${count === 1 ? '' : 's'}`

export type BulkActions = {
  moveTo: (snippets: readonly Snippet[], collection: { id: string; name: string } | null) => Promise<void>
  setFavorite: (snippets: readonly Snippet[], isFavorite: boolean) => Promise<void>
  changeTags: (
    snippets: readonly Snippet[],
    add: readonly string[],
    remove: readonly string[],
  ) => Promise<void>
  exportSnippets: (snippets: readonly Snippet[]) => Promise<void>
  /** Moves the snippets to the Trash (one Undo for all of them) and ends selection mode. */
  remove: (snippets: readonly Snippet[]) => Promise<void>
}

/**
 * Actions on the current selection. Each is one transaction and one toast, and every change can be
 * undone in one step. The selection is kept afterwards (except after deleting), so several
 * actions can be applied to the same set.
 */
export function useBulkActions(): BulkActions {
  const selection = useSelectionStore()
  const backup = useBackup()

  return useMemo<BulkActions>(() => {
    /** Applies a change and shows `message(count)` with an Undo that puts every field back. */
    async function update(
      snippets: readonly Snippet[],
      change: BulkSnippetChange,
      message: (changed: number) => string,
      describe?: (result: BulkUpdateResult) => string | undefined,
    ) {
      try {
        const result = await snippetRepository.bulkUpdate(
          snippets.map((s) => s.id),
          change,
        )
        if (result.before.length === 0) {
          toast('Nothing to change', {
            description: describe?.(result) ?? 'The selected snippets already match.',
          })
          return
        }
        toast.success(message(result.before.length), {
          description: describe?.(result),
          duration: UNDO_TOAST_MS,
          action: {
            label: 'Undo',
            onClick: () => {
              snippetRepository
                .revertBulkUpdate(result.before)
                .catch((error: unknown) => toast.error(getErrorMessage(error)))
            },
          },
        })
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    }

    return {
      moveTo: (snippets, collection) =>
        update(snippets, { collectionId: collection?.id ?? null }, (count) =>
          collection
            ? `Moved ${pluralSnippets(count)} to ${collection.name}`
            : `Removed ${pluralSnippets(count)} from their collection`,
        ),

      setFavorite: (snippets, isFavorite) =>
        update(snippets, { isFavorite }, (count) =>
          isFavorite
            ? `Added ${pluralSnippets(count)} to favorites`
            : `Removed ${pluralSnippets(count)} from favorites`,
        ),

      changeTags: (snippets, add, remove) =>
        update(
          snippets,
          { addTags: add, removeTags: remove },
          (count) => `Updated tags on ${pluralSnippets(count)}`,
          ({ tagLimited }) =>
            tagLimited > 0
              ? `${pluralSnippets(tagLimited)} reached the ${LIMITS.tagsPerSnippetMax}-tag limit, so some tags weren't added.`
              : undefined,
        ),

      exportSnippets: (snippets) => backup.exportSnippets(snippets),

      async remove(snippets) {
        try {
          const ids = await snippetRepository.softDeleteMany(snippets.map((s) => s.id))
          selection.clear()
          if (ids.length === 0) return
          toast(`Moved ${pluralSnippets(ids.length)} to the Trash`, {
            duration: UNDO_TOAST_MS,
            action: {
              label: 'Undo',
              onClick: () => {
                snippetRepository
                  .restoreMany(ids)
                  .catch((error: unknown) => toast.error(getErrorMessage(error)))
              },
            },
          })
        } catch (error) {
          toast.error(getErrorMessage(error))
        }
      },
    }
  }, [backup, selection])
}
