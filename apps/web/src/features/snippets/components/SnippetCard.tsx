import { memo } from 'react'
import { Star } from 'lucide-react'
import { getLanguageLabel, type Collection, type Snippet } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { formatDateTime, formatRelativeTime } from '@/lib/dates'
import { LIFT_ON_HOVER } from '@/lib/layout'
import { cn } from '@/lib/utils'

const PREVIEW_MAX_CHARS = 600
const PREVIEW_MAX_LINES = 8
const VISIBLE_TAGS = 3

type SnippetCardProps = {
  snippet: Snippet
  collection?: Collection
  onOpen: (snippetId: string) => void
  /** Hover/focus intent — used to warm the editor before the click lands. */
  onIntent?: () => void
}

function buildPreview(content: string): { text: string; isTruncated: boolean } {
  const lines = content.slice(0, PREVIEW_MAX_CHARS).split('\n').slice(0, PREVIEW_MAX_LINES)
  const text = lines.join('\n')
  return { text, isTruncated: text.length < content.length || lines.length >= 6 }
}

/** Library card. The whole card is clickable via a stretched title button (one tab stop). */
export const SnippetCard = memo(function SnippetCard({
  snippet,
  collection,
  onOpen,
  onIntent,
}: SnippetCardProps) {
  const preview = buildPreview(snippet.content)
  const hiddenTagCount = Math.max(0, snippet.tags.length - VISIBLE_TAGS)

  return (
    <article
      onPointerEnter={onIntent}
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-card p-4 text-card-foreground shadow-xs',
        LIFT_ON_HOVER,
        'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
      )}
    >
      <header className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-[15px] leading-snug font-semibold">
          <button
            type="button"
            onClick={() => onOpen(snippet.id)}
            onFocus={onIntent}
            className="line-clamp-2 text-left outline-none after:absolute after:inset-0 after:rounded-2xl"
          >
            {snippet.title}
          </button>
        </h3>
        {snippet.isFavorite && (
          <Star
            className="mt-0.5 size-4 shrink-0 fill-favorite text-favorite"
            role="img"
            aria-label="Favorite"
          />
        )}
      </header>

      {snippet.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snippet.description}</p>
      )}

      <pre
        className={cn(
          'mt-3 max-h-36 overflow-hidden rounded-lg border bg-code px-3 py-2.5 font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-foreground/90',
          preview.isTruncated && 'mask-b-from-60%',
        )}
      >
        <code>{preview.text}</code>
      </pre>

      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5">
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

      <footer className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-foreground">
        <span className="font-medium">{getLanguageLabel(snippet.language)}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={new Date(snippet.updatedAt).toISOString()} title={formatDateTime(snippet.updatedAt)}>
          {formatRelativeTime(snippet.updatedAt)}
        </time>
        {snippet.copyCount > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>Copied {snippet.copyCount}×</span>
          </>
        )}
      </footer>
    </article>
  )
})
