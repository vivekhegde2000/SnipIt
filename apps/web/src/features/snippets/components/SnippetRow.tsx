import { memo, useMemo } from 'react'
import { hasTemplateVariables } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { CopyButton } from '@/components/CopyButton'
import { FavoriteButton } from '@/components/FavoriteButton'
import { HighlightText } from '@/components/HighlightText'
import { SelectionCheckbox } from '@/features/selection/SelectionCheckbox'
import { useSelectableItem } from '@/features/selection/use-selectable-item'
import { cn } from '@/lib/utils'
import { SnippetActionsMenu } from '../actions/SnippetActionsMenu'
import { handleSnippetShortcut } from '../actions/snippet-shortcuts'
import { useSnippetActions } from '../actions/use-snippet-actions'
import { SELECTABLE_ITEM_CLASSES, type SnippetItemProps } from './SnippetCard'
import { SnippetMeta } from './SnippetMeta'

const VISIBLE_TAGS = 2

/** First non-empty line of the content, for the one-line preview. */
function firstLine(content: string): string {
  for (const line of content.slice(0, 400).split('\n')) {
    if (line.trim()) return line.trim()
  }
  return ''
}

/**
 * Compact list row: everything a card has except the multi-line preview, so far more snippets
 * fit on screen. Same keyboard shortcuts, selection and stretched-button behaviour as the card
 * (it also carries `data-snippet-card`, so J/K and the arrow keys move between rows).
 */
export const SnippetRow = memo(function SnippetRow({
  snippet,
  collection,
  titleMatches,
  onIntent,
}: SnippetItemProps) {
  const actions = useSnippetActions()
  const selection = useSelectableItem(snippet.id)
  const isTemplate = useMemo(() => hasTemplateVariables(snippet.content), [snippet.content])
  const preview = snippet.description || firstLine(snippet.content)
  const hiddenTagCount = Math.max(0, snippet.tags.length - VISIBLE_TAGS)

  return (
    <article
      data-snippet-card
      data-selected={selection.isSelected || undefined}
      onPointerEnter={onIntent}
      onKeyDown={(event) => {
        if (!selection.handleKeyDown(event)) handleSnippetShortcut(event, snippet, actions)
      }}
      {...selection.pressProps}
      className={cn(
        'group relative flex items-center gap-2 rounded-xl border bg-card py-2 pr-2 pl-1 text-card-foreground shadow-xs transition-[border-color] duration-150 hover:border-foreground/15 sm:gap-3 sm:pr-3',
        'has-[[data-card-primary]:focus-visible]:ring-3 has-[[data-card-primary]:focus-visible]:ring-ring/50',
        SELECTABLE_ITEM_CLASSES,
      )}
    >
      {/* With a mouse the tick appears on hover (its space is always reserved, so nothing
          shifts); on touch screens it appears in selection mode (press and hold a row). */}
      <div className="relative z-10 flex shrink-0 items-center">
        <SelectionCheckbox
          checked={selection.isSelected}
          label={`Select ${snippet.title}`}
          onToggle={selection.toggle}
          focusable={selection.selectionActive}
          className={cn(
            'transition-opacity duration-150',
            !selection.selectionActive &&
              'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:hidden',
          )}
        />
        <FavoriteButton
          isFavorite={snippet.isFavorite}
          onToggle={() => void actions.toggleFavorite(snippet)}
        />
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <h2 className="truncate text-sm leading-snug font-semibold">
          <button
            type="button"
            data-card-primary
            onClick={(event) => {
              if (!selection.handleClick(event)) actions.open(snippet)
            }}
            onFocus={onIntent}
            aria-pressed={selection.selectionActive ? selection.isSelected : undefined}
            aria-keyshortcuts="C E F D O X Delete"
            className="max-w-full truncate text-left outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            <HighlightText text={snippet.title} ranges={titleMatches} />
          </button>
        </h2>
        <p
          className={cn(
            'truncate text-xs text-muted-foreground',
            !snippet.description && 'font-mono text-[11.5px]',
          )}
        >
          {preview}
        </p>
        <SnippetMeta snippet={snippet} isTemplate={isTemplate} className="mt-1 md:hidden" />
      </div>

      {(collection || snippet.tags.length > 0) && (
        <div className="hidden max-w-[40%] shrink-0 items-center gap-1.5 lg:flex">
          {collection && (
            <span className="inline-flex h-6 min-w-0 items-center gap-1.5 rounded-full bg-muted px-2 text-xs font-medium">
              <ColorDot color={collection.color} className="size-2" />
              <span className="truncate">{collection.name}</span>
            </span>
          )}
          {snippet.tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <span
              key={tag}
              className="inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {hiddenTagCount > 0 && (
            <span
              className="shrink-0 text-xs text-muted-foreground"
              aria-label={`${hiddenTagCount} more tags`}
            >
              +{hiddenTagCount}
            </span>
          )}
        </div>
      )}

      <SnippetMeta
        snippet={snippet}
        isTemplate={isTemplate}
        className="hidden w-52 shrink-0 flex-nowrap justify-end overflow-hidden whitespace-nowrap md:flex"
      />

      <div className="relative z-10 flex shrink-0 items-center gap-1">
        <SnippetActionsMenu snippet={snippet} actions={actions} />
        <CopyButton
          size="icon-sm"
          iconOnly
          variant="outline"
          onCopy={() => actions.copy(snippet)}
          accessibleLabel={`Copy ${snippet.title}`}
          aria-keyshortcuts="C"
          className="sm:hidden"
        />
        <CopyButton
          size="sm"
          onCopy={() => actions.copy(snippet)}
          accessibleLabel={`Copy ${snippet.title}`}
          aria-keyshortcuts="C"
          className="max-sm:hidden"
        />
      </div>
    </article>
  )
})
