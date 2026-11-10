import { useMemo } from 'react'
import {
  CheckCheck,
  Download,
  FolderInput,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Star,
  Tags,
  Trash2,
} from 'lucide-react'
import type { Snippet } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCollectionEditor } from '@/features/collections/editor/collection-editor-context'
import { useLibrary } from '@/features/library/library-context'
import {
  BAR_BUTTON_CLASSES,
  BarButton,
  BarDivider,
  SelectionBar,
  SelectionSummary,
} from '@/features/selection/SelectionBar'
import { useSelection, useSelectionStore } from '@/features/selection/selection-context'
import { cn } from '@/lib/utils'
import { BulkTagsPopover } from './BulkTagsPopover'
import { pluralSnippets, useBulkActions } from './use-bulk-actions'

type BulkActionBarProps = {
  /** Ids the page currently lists (after search and filters), in display order. */
  visibleIds: readonly string[]
}

/**
 * Actions for the selected snippets: move, tags, favorite, export and delete. The selection can
 * include snippets hidden by the current search or filters (it is kept while you search); the
 * bar says how many, so nothing changes out of sight without you knowing.
 *
 * Phones and small tablets show Move, Tags and Delete; Favorite, Export and Select all move into
 * a "More" menu so the bar fits a 360 px screen.
 */
export function BulkActionBar({ visibleIds }: BulkActionBarProps) {
  const { snippets, collections } = useLibrary()
  const selection = useSelection()
  const store = useSelectionStore()
  const bulk = useBulkActions()
  const collectionEditor = useCollectionEditor()

  // Snippets deleted elsewhere (another tab, Undo) simply drop out of the count.
  const selected = useMemo<Snippet[]>(
    () => (selection.ids.size === 0 ? [] : snippets.filter((s) => selection.ids.has(s.id))),
    [snippets, selection.ids],
  )
  const visible = useMemo(() => new Set(visibleIds), [visibleIds])
  const hidden = selected.filter((s) => !visible.has(s.id)).length
  const canSelectAll = visibleIds.some((id) => !selection.ids.has(id))
  const allFavorite = selected.length > 0 && selected.every((s) => s.isFavorite)
  const none = selected.length === 0
  const toggleFavorites = () => void bulk.setFavorite(selected, !allFavorite)

  return (
    <SelectionBar show={selection.active} label="Selected snippets">
      <SelectionSummary
        count={selected.length}
        hidden={hidden}
        canSelectAll={canSelectAll}
        totalListed={visibleIds.length}
        onSelectAll={store.selectAll}
        onExit={store.clear}
        selectAllClassName="max-md:hidden"
      />
      <BarDivider />

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                disabled={none}
                aria-label="Move to collection"
                className={BAR_BUTTON_CLASSES}
              >
                <FolderInput aria-hidden="true" />
                <span className="max-sm:sr-only">Move</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="sm:hidden">
            Move to collection
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          side="top"
          align="center"
          sideOffset={10}
          className="max-h-80 w-56 overflow-y-auto"
        >
          <DropdownMenuLabel>Move {pluralSnippets(selected.length)} to</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => void bulk.moveTo(selected, null)}>
            <FolderOpen className="text-muted-foreground" aria-hidden="true" />
            No collection
          </DropdownMenuItem>
          {collections.map((collection) => (
            <DropdownMenuItem key={collection.id} onSelect={() => void bulk.moveTo(selected, collection)}>
              <ColorDot color={collection.color} />
              <span className="truncate">{collection.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              collectionEditor.create({ onCreated: (created) => void bulk.moveTo(selected, created) })
            }
          >
            <Plus aria-hidden="true" />
            New collection…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BulkTagsPopover
        snippets={selected}
        onApply={(add, remove) => void bulk.changeTags(selected, add, remove)}
      >
        <Button variant="ghost" disabled={none} aria-label="Edit tags" className={BAR_BUTTON_CLASSES}>
          <Tags aria-hidden="true" />
          <span className="max-sm:sr-only">Tags</span>
        </Button>
      </BulkTagsPopover>

      <BarButton
        icon={Star}
        label={allFavorite ? 'Unfavorite' : 'Favorite'}
        disabled={none}
        onClick={toggleFavorites}
        className={cn('max-md:hidden', allFavorite && '[&_svg]:fill-favorite [&_svg]:text-favorite')}
      />
      <BarButton
        icon={Download}
        label="Export"
        disabled={none}
        onClick={() => void bulk.exportSnippets(selected)}
        className="max-md:hidden"
      />
      <BarButton
        icon={Trash2}
        label="Delete"
        disabled={none}
        onClick={() => void bulk.remove(selected)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions" className="md:hidden">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={10} className="w-56">
          {canSelectAll && (
            <DropdownMenuItem onSelect={store.selectAll}>
              <CheckCheck aria-hidden="true" />
              Select all {visibleIds.length.toLocaleString()}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled={none} onSelect={toggleFavorites}>
            <Star aria-hidden="true" className={cn(allFavorite && 'fill-favorite text-favorite')} />
            {allFavorite ? 'Remove from favorites' : 'Add to favorites'}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={none} onSelect={() => void bulk.exportSnippets(selected)}>
            <Download aria-hidden="true" />
            Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SelectionBar>
  )
}
