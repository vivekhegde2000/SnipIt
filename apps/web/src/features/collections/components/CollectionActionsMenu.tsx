import type { ComponentProps } from 'react'
import { Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useCollectionEditor } from '../editor/collection-editor-context'

type CollectionActionsMenuProps = {
  collection: Collection
  triggerClassName?: string
  triggerSize?: ComponentProps<typeof Button>['size']
  align?: 'start' | 'end'
}

/** "⋯" menu for a collection: edit (rename / colour / icon), export and delete. */
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
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => remove(collection)}>
          <Trash2 aria-hidden="true" />
          Delete collection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
