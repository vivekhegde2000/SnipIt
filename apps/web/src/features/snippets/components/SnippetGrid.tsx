import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { Collection, Snippet } from '@snipit/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { focusAdjacentCard, isEditableTarget } from '@/lib/keyboard'
import { SNIPPET_GRID } from '@/lib/layout'
import { STAGGER_LIMIT, STAGGER_STEP, TRANSITION } from '@/lib/motion'
import { useSnippetEditor } from '../editor/snippet-editor-context'
import { SnippetCard } from './SnippetCard'

/** Cards rendered per batch; more are added just before the user scrolls to the end. */
const PAGE_SIZE = 48
/** Start rendering the next batch this far before the end of the list is visible. */
const PRELOAD_MARGIN = '1200px'
/** Above this many rendered cards, skip enter/exit animations entirely. */
const ANIMATION_LIMIT = 60

/**
 * Exit animation, decided at removal time via AnimatePresence `custom`:
 * - a single card removed (delete) → fade/scale out
 * - results replaced by a new query → disappear instantly (no ghost cards over new results)
 *
 * Deliberately no `layout`/`popLayout`: layout projection measures the page on every render and
 * was the main cost while typing in a large library (profiled).
 */
const cardVariants = {
  exit: (instant: boolean) =>
    instant
      ? { opacity: 0, transition: { duration: 0 } }
      : { opacity: 0, scale: 0.96, transition: TRANSITION.fast },
}

type TitleMatches = ReadonlyArray<readonly [number, number]>

type SnippetGridProps = {
  snippets: readonly Snippet[]
  collectionsById: ReadonlyMap<string, Collection>
  /** Search-match ranges per snippet id (title highlighting). */
  titleMatches?: ReadonlyMap<string, TitleMatches>
  /** Changes whenever the query/view changes; resets incremental rendering to the first batch. */
  resetKey: string
}

/** Arrow keys move between cards: ←/→ by one, ↑/↓ by a whole row of the fluid grid. */
function handleGridKeyDown(event: KeyboardEvent<HTMLUListElement>) {
  if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return
  if ((event.target as HTMLElement).closest('[role="menu"]')) return
  const columns = getComputedStyle(event.currentTarget).gridTemplateColumns.split(' ').length || 1
  const deltas: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: columns,
    ArrowUp: -columns,
  }
  const delta = deltas[event.key]
  if (delta === undefined) return
  event.preventDefault()
  focusAdjacentCard(delta)
}

/**
 * Memoised: the page re-renders on every keystroke in the search box (urgent update), but the
 * grid only needs to re-render when its (deferred) results change.
 */
export const SnippetGrid = memo(function SnippetGrid({
  snippets,
  collectionsById,
  titleMatches,
  resetKey,
}: SnippetGridProps) {
  const { preload } = useSnippetEditor()
  const [limit, setLimit] = useState(PAGE_SIZE)
  // What the last committed render showed, to classify changes ("adjust state while rendering").
  const [previous, setPrevious] = useState({ key: resetKey, list: snippets })
  const [instantExit, setInstantExit] = useState(false)
  if (previous.key !== resetKey || previous.list !== snippets) {
    const isNewQuery = previous.key !== resetKey
    setPrevious({ key: resetKey, list: snippets })
    setInstantExit(isNewQuery)
    if (isNewQuery) setLimit(PAGE_SIZE) // new query/view → back to the first batch
  }

  // Stagger only the cards present when the grid mounts; later additions simply fade in.
  const [initialIds] = useState(() => new Set(snippets.slice(0, STAGGER_LIMIT).map((s) => s.id)))
  const shown = snippets.length > limit ? snippets.slice(0, limit) : snippets
  const hasMore = shown.length < snippets.length
  const animate = shown.length <= ANIMATION_LIMIT

  // Render the next batch when the sentinel approaches the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!hasMore || !sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setLimit((current) => current + PAGE_SIZE)
      },
      { rootMargin: PRELOAD_MARGIN },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, limit])

  return (
    <>
      <ul className={SNIPPET_GRID} aria-label="Snippets" onKeyDown={handleGridKeyDown}>
        <AnimatePresence initial={animate} custom={instantExit || !animate}>
          {shown.map((snippet, index) => (
            // `grid` makes the card fill the row height, so cards in a row line up.
            <m.li
              key={snippet.id}
              variants={cardVariants}
              initial={animate ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit="exit"
              transition={{
                ...TRANSITION.base,
                delay: initialIds.has(snippet.id) ? index * STAGGER_STEP : 0,
              }}
              className="grid"
            >
              <SnippetCard
                snippet={snippet}
                collection={snippet.collectionId ? collectionsById.get(snippet.collectionId) : undefined}
                titleMatches={titleMatches?.get(snippet.id)}
                onIntent={preload}
              />
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6" role="status">
          <span className="text-sm text-muted-foreground">
            Showing {shown.length.toLocaleString()} of {snippets.length.toLocaleString()}…
          </span>
        </div>
      )}
    </>
  )
})

export function SnippetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={SNIPPET_GRID} role="status" aria-label="Loading snippets">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border bg-card p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-3 h-24 w-full rounded-lg" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
