import type { ComponentProps } from 'react'
import {
  Copy,
  CopyPlus,
  Download,
  FolderInput,
  FolderOpen,
  MoreHorizontal,
  PanelRightOpen,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import type { Snippet } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCollectionEditor } from '@/features/collections/editor/collection-editor-context'
import { useLibrary } from '@/features/library/library-context'
import { cn } from '@/lib/utils'
import type { SnippetActions } from './use-snippet-actions'

const NONE = '__none__'

type SnippetActionsMenuProps = {
  snippet: Snippet
  actions: SnippetActions
  /** Hide "Open details" when already in the detail view. */
  showOpen?: boolean
  align?: 'start' | 'end'
  triggerSize?: ComponentProps<typeof Button>['size']
  triggerClassName?: string
}

/**
 * Submenu body. Only mounted while the submenu is open, so the library subscription lives here
 * instead of in every card on the page.
 */
function MoveToCollectionItems({ snippet, actions }: { snippet: Snippet; actions: SnippetActions }) {
  const { collections, collectionsById } = useLibrary()
  const collectionEditor = useCollectionEditor()

  const moveTo = (value: string) => {
    if (value === NONE) return void actions.moveToCollection(snippet, null)
    const collection = collectionsById.get(value)
    if (collection) void actions.moveToCollection(snippet, collection)
  }

  return (
    <>
      <DropdownMenuRadioGroup value={snippet.collectionId ?? NONE} onValueChange={moveTo}>
        <DropdownMenuRadioItem value={NONE}>
          <FolderOpen className="text-muted-foreground" aria-hidden="true" />
          No collection
        </DropdownMenuRadioItem>
        {collections.map((collection) => (
          <DropdownMenuRadioItem key={collection.id} value={collection.id}>
            <ColorDot color={collection.color} />
            <span className="truncate">{collection.name}</span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() =>
          collectionEditor.create({ onCreated: (created) => void actions.moveToCollection(snippet, created) })
        }
      >
        <Plus aria-hidden="true" />
        New collection…
      </DropdownMenuItem>
    </>
  )
}

/** The "⋯" menu for a snippet. Shortcut hints match the card-level keyboard shortcuts. */
export function SnippetActionsMenu({
  snippet,
  actions,
  showOpen = true,
  align = 'end',
  triggerSize = 'icon-sm',
  triggerClassName,
}: SnippetActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={triggerSize}
          aria-label={`More actions for ${snippet.title}`}
          onClick={(event) => event.stopPropagation()}
          className={cn('text-muted-foreground hover:text-foreground', triggerClassName)}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56" onClick={(event) => event.stopPropagation()}>
        {showOpen && (
          <DropdownMenuItem onSelect={() => actions.open(snippet)}>
            <PanelRightOpen aria-hidden="true" />
            Open details
            <DropdownMenuShortcut>O</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => actions.edit(snippet)}>
          <Pencil aria-hidden="true" />
          Edit
          <DropdownMenuShortcut>E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void actions.copy(snippet)}>
          <Copy aria-hidden="true" />
          Copy content
          <DropdownMenuShortcut>C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void actions.toggleFavorite(snippet)}>
          <Star aria-hidden="true" className={cn(snippet.isFavorite && 'fill-favorite text-favorite')} />
          {snippet.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          <DropdownMenuShortcut>F</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void actions.duplicate(snippet)}>
          <CopyPlus aria-hidden="true" />
          Duplicate
          <DropdownMenuShortcut>D</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput aria-hidden="true" />
            Move to collection
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-80 w-56 overflow-y-auto">
            <MoveToCollectionItems snippet={snippet} actions={actions} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onSelect={() => actions.download(snippet)}>
          <Download aria-hidden="true" />
          Download as file
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void actions.remove(snippet)}>
          <Trash2 aria-hidden="true" />
          Delete
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
