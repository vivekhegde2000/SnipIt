import { useMemo } from 'react'
import { toast } from 'sonner'
import { collectionRepository, getErrorMessage } from '@/db'
import { useLibrary } from '@/features/library/library-context'

export type CollectionOrder = {
  /**
   * Saves a new order (all active collection ids). `movedName` labels the Undo toast. Resolves
   * `false` if it could not be saved (the error is already shown).
   */
  save: (orderedIds: readonly string[], movedName: string) => Promise<boolean>
  /** Moves one collection up (-1) or down (+1). */
  move: (id: string, delta: -1 | 1) => Promise<void>
}

/** Reordering collections (drag and drop on the Collections page, Move up/down in ⋯ menus). */
export function useCollectionOrder(): CollectionOrder {
  const { collections } = useLibrary()

  return useMemo<CollectionOrder>(() => {
    async function save(orderedIds: readonly string[], movedName: string): Promise<boolean> {
      try {
        const previous = await collectionRepository.reorder(orderedIds)
        toast.success(`Moved “${movedName}”`, {
          action: {
            label: 'Undo',
            onClick: () => {
              collectionRepository
                .reorder(previous)
                .catch((error: unknown) => toast.error(getErrorMessage(error)))
            },
          },
        })
        return true
      } catch (error) {
        toast.error(getErrorMessage(error))
        return false
      }
    }

    return {
      save,
      async move(id, delta) {
        const ids = collections.map((c) => c.id)
        const from = ids.indexOf(id)
        const moved = collections[from]
        const neighbour = ids[from + delta]
        if (!moved || neighbour === undefined) return
        ids[from + delta] = id
        ids[from] = neighbour
        await save(ids, moved.name)
      },
    }
  }, [collections])
}
