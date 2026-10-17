import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { Collection, Snippet } from '@snipit/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { SNIPPET_GRID } from '@/lib/layout'
import { STAGGER_LIMIT, STAGGER_STEP, TRANSITION } from '@/lib/motion'
import { useSnippetEditor } from '../editor/snippet-editor-context'
import { SnippetCard } from './SnippetCard'

/** Above this many cards, skip layout (reflow) animations — measuring hundreds of nodes isn't free. */
const LAYOUT_ANIMATION_LIMIT = 60

type SnippetGridProps = {
  snippets: readonly Snippet[]
  collectionsById: ReadonlyMap<string, Collection>
}

export function SnippetGrid({ snippets, collectionsById }: SnippetGridProps) {
  const { openEdit, preload } = useSnippetEditor()
  // Stagger only the cards present when the grid mounts; later additions simply fade in.
  const [initialIds] = useState(() => new Set(snippets.slice(0, STAGGER_LIMIT).map((s) => s.id)))
  const animateLayout = snippets.length <= LAYOUT_ANIMATION_LIMIT

  return (
    <ul className={SNIPPET_GRID} aria-label="Snippets">
      <AnimatePresence initial={true} mode="popLayout">
        {snippets.map((snippet, index) => (
          // `grid` makes the card fill the row height, so cards in a row line up.
          <m.li
            key={snippet.id}
            layout={animateLayout ? 'position' : false}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: TRANSITION.fast }}
            transition={{
              ...TRANSITION.base,
              delay: initialIds.has(snippet.id) ? index * STAGGER_STEP : 0,
              layout: TRANSITION.layout,
            }}
            className="grid"
          >
            <SnippetCard
              snippet={snippet}
              collection={snippet.collectionId ? collectionsById.get(snippet.collectionId) : undefined}
              onOpen={openEdit}
              onIntent={preload}
            />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

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
