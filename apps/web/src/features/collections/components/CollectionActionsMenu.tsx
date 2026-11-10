import type { ComponentProps } from 'react'
import { ArrowDown, ArrowUp, Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Collection } from '@snipit/shared'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBackup } from '@/features/backup/backup-context'
import { useLibrary } from '@/features/library/library-context'
import { cn } from '@/lib/utils'
import { useCollectionEditor } from '../editor/collection-editor-context'
import { useCollectionOrder } from '../use-collection-order'

type CollectionActionsMenuProps = {
  collection: Collection
  triggerClassName?: string
  triggerSize?: ComponentProps<typeof Button>['size']
  align?: 'start' | 'end'
}

/**
 * Move up / Move down — the non-drag way to reorder. Only mounted while the menu is open, so the
 * library subscription lives here instead of in every sidebar row.
 */
function MoveItems({ collection }: { collection: Collection }) {
  const { collections } = useLibrary()
  const order = useCollectionOrder()
  const index = collections.findIndex((c) => c.id === collection.id)
  if (collections.length < 2 || index === -1) return null
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={index === 0} onSelect={() => void order.move(collection.id, -1)}>
        <ArrowUp aria-hidden="true" />
        Move up
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={index === collections.length - 1}
        onSelect={() => void order.move(collection.id, 1)}
      >
        <ArrowDown aria-hidden="true" />
        Move down
      </DropdownMenuItem>
    </>
  )
}

/** "⋯" menu for a collection: edit (rename / colour / icon), export, reorder and delete. */
export function CollectionActionsMenu({
  collection,
  triggerClassName,
  triggerSize = 'icon-sm',
  align = 'end',
}: CollectionActionsMenuProps) {
  const { edit, remove } = useCollectionEditor()
  const { exportCollection } = useBackup()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={triggerSize}
          aria-label={`Actions for ${collection.name}`}
          onClick={(event) => event.stopPropagation()}
          className={cn('text-muted-foreground hover:text-foreground', triggerClassName)}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={() => edit(collection.id)}>
          <Pencil aria-hidden="true" />
          Edit collection
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exportCollection(collection)}>
          <Download aria-hidden="true" />
          Export collection
        </DropdownMenuItem>
        <MoveItems collection={collection} />
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => remove(collection)}>
          <Trash2 aria-hidden="true" />
          Delete collection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
