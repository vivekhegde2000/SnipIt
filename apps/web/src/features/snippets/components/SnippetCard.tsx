import { memo } from 'react'
import { getLanguageLabel, type Collection, type Snippet } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { CopyButton } from '@/components/CopyButton'
import { FavoriteButton } from '@/components/FavoriteButton'
import { HighlightText } from '@/components/HighlightText'
import { formatDateTime, formatRelativeTime } from '@/lib/dates'
import { LIFT_ON_HOVER } from '@/lib/layout'
import { cn } from '@/lib/utils'
import { SnippetActionsMenu } from '../actions/SnippetActionsMenu'
import { handleSnippetShortcut } from '../actions/snippet-shortcuts'
import { useSnippetActions } from '../actions/use-snippet-actions'
import { CodeBlock } from '../code/CodeBlock'

const PREVIEW_MAX_CHARS = 600
const PREVIEW_MAX_LINES = 8
const VISIBLE_TAGS = 3

type SnippetCardProps = {
  snippet: Snippet
  collection?: Collection
  /** Search-match ranges in the title. */
  titleMatches?: ReadonlyArray<readonly [number, number]>
  /** Hover/focus intent — used to warm the editor before an edit. */
  onIntent?: () => void
}

function buildPreview(content: string): { text: string; isTruncated: boolean } {
  const lines = content.slice(0, PREVIEW_MAX_CHARS).split('\n').slice(0, PREVIEW_MAX_LINES)
  const text = lines.join('\n')
  return { text, isTruncated: text.length < content.length || lines.length >= 6 }
}

/**
 * Library card. The title is a stretched button (whole card opens the detail view, one tab stop);
 * Copy, favorite and the "⋯" menu sit above it. With focus inside the card, single-key shortcuts
 * apply to this snippet (C copy, E edit, F favorite, D duplicate, O open, Del delete).
 */
export const SnippetCard = memo(function SnippetCard({
  snippet,
  collection,
  titleMatches,
  onIntent,
}: SnippetCardProps) {
  const actions = useSnippetActions()
  const preview = buildPreview(snippet.content)
  const hiddenTagCount = Math.max(0, snippet.tags.length - VISIBLE_TAGS)

  return (
    <article
      data-snippet-card
      onPointerEnter={onIntent}
      onKeyDown={(event) => handleSnippetShortcut(event, snippet, actions)}
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-card p-4 text-card-foreground shadow-xs',
        LIFT_ON_HOVER,
        'has-[[data-card-primary]:focus-visible]:ring-3 has-[[data-card-primary]:focus-visible]:ring-ring/50',
      )}
    >
      <header className="flex items-start gap-1">
        <h3 className="min-w-0 flex-1 pt-0.5 text-[15px] leading-snug font-semibold">
          <button
            type="button"
            data-card-primary
            onClick={() => actions.open(snippet)}
            onFocus={onIntent}
            aria-keyshortcuts="C E F D O Delete"
            className="line-clamp-2 text-left outline-none after:absolute after:inset-0 after:rounded-2xl"
          >
            <HighlightText text={snippet.title} ranges={titleMatches} />
          </button>
        </h3>
        <FavoriteButton
          isFavorite={snippet.isFavorite}
          onToggle={() => void actions.toggleFavorite(snippet)}
          className="relative z-10 -mt-1 -mr-1.5"
        />
      </header>

      {snippet.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snippet.description}</p>
      )}

      <CodeBlock
        code={preview.text}
        language={snippet.language}
        aria-label={`Preview of ${snippet.title}`}
        className={cn(
          'mt-3 max-h-40 overflow-hidden rounded-lg border bg-code px-3 py-2.5 text-foreground/90',
          preview.isTruncated && 'mask-b-from-55%',
        )}
      />

      {(collection || snippet.tags.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {collection && (
            <span className="inline-flex h-6 max-w-40 items-center gap-1.5 rounded-full bg-muted px-2 text-xs font-medium">
              <ColorDot color={collection.color} className="size-2" />
              <span className="truncate">{collection.name}</span>
            </span>
          )}
          {snippet.tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <span
              key={tag}
              className="inline-flex h-6 items-center rounded-full border px-2 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {hiddenTagCount > 0 && (
            <span className="text-xs text-muted-foreground" aria-label={`${hiddenTagCount} more tags`}>
              +{hiddenTagCount}
            </span>
          )}
        </div>
      )}

      <footer className="mt-auto flex items-center gap-2 pt-3">
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span className="font-medium">{getLanguageLabel(snippet.language)}</span>
          <span aria-hidden="true">·</span>
          <time
            dateTime={new Date(snippet.updatedAt).toISOString()}
            title={formatDateTime(snippet.updatedAt)}
          >
            {formatRelativeTime(snippet.updatedAt)}
          </time>
          {snippet.copyCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span title="Times copied">{snippet.copyCount}×</span>
            </>
          )}
        </p>
        <div className="relative z-10 flex shrink-0 items-center gap-1">
          <SnippetActionsMenu snippet={snippet} actions={actions} />
          <CopyButton size="sm" onCopy={() => actions.copy(snippet)} aria-keyshortcuts="C" />
        </div>
      </footer>
    </article>
  )
})
