import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { Collection } from '@snipit/shared'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { collectionRepository, getErrorMessage } from '@/db'
import { useLibrary } from '@/features/library/library-context'
import { CollectionDialog } from './CollectionDialog'
import {
  CollectionEditorContext,
  type CollectionEditorApi,
  type CreateCollectionOptions,
} from './collection-editor-context'

type DialogSession =
  | { id: number; open: boolean; mode: 'create'; options?: CreateCollectionOptions }
  | { id: number; open: boolean; mode: 'edit'; collectionId: string }

/** Owns the collection create/edit dialog and the delete confirmation (with Undo). */
export function CollectionEditorProvider({ children }: { children: ReactNode }) {
  const { collectionsById, counts } = useLibrary()
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState<DialogSession | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null)

  const close = useCallback(
    () => setSession((current) => (current ? { ...current, open: false } : current)),
    [],
  )

  const confirmDelete = useCallback(async () => {
    const collection = pendingDelete
    if (!collection) return
    setPendingDelete(null)
    try {
      const { snippetIds } = await collectionRepository.softDelete(collection.id)
      if (location.pathname === `/collections/${collection.id}`) navigate('/collections', { replace: true })
      toast(`Deleted “${collection.name}”`, {
        description: snippetIds.length
          ? `${snippetIds.length} snippet${snippetIds.length === 1 ? '' : 's'} moved to Unsorted.`
          : undefined,
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => {
            collectionRepository
              .restore(collection.id, snippetIds)
              .catch((error: unknown) => toast.error(getErrorMessage(error)))
          },
        },
      })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }, [pendingDelete, location.pathname, navigate])

  const api = useMemo<CollectionEditorApi>(
    () => ({
      create: (options) =>
        setSession((current) => ({ id: (current?.id ?? 0) + 1, open: true, mode: 'create', options })),
      edit: (collectionId) =>
        setSession((current) => ({ id: (current?.id ?? 0) + 1, open: true, mode: 'edit', collectionId })),
      remove: (collection) => setPendingDelete(collection),
    }),
    [],
  )

  const editing = session?.mode === 'edit' ? collectionsById.get(session.collectionId) : undefined
  const deleteCount = pendingDelete ? (counts.byCollection.get(pendingDelete.id) ?? 0) : 0

  return (
    <CollectionEditorContext value={api}>
      {children}

      {session && (session.mode === 'create' || editing) && (
        <CollectionDialog
          key={session.id}
          open={session.open}
          onClose={close}
          collection={editing}
          onCreated={session.mode === 'create' ? session.options?.onCreated : undefined}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete “${pendingDelete?.name ?? ''}”?`}
        description={
          deleteCount > 0
            ? `Its ${deleteCount} snippet${deleteCount === 1 ? '' : 's'} will be kept and moved to Unsorted.`
            : 'This collection is empty.'
        }
        confirmLabel="Delete collection"
        destructive
        onConfirm={() => void confirmDelete()}
      />
    </CollectionEditorContext>
  )
}
