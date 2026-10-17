import type { Collection, Snippet } from '@snipit/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { useSnippetEditor } from '../editor/snippet-editor-context'
import { SnippetCard } from './SnippetCard'

const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'

type SnippetGridProps = {
  snippets: readonly Snippet[]
  collectionsById: ReadonlyMap<string, Collection>
}

export function SnippetGrid({ snippets, collectionsById }: SnippetGridProps) {
  const { openEdit } = useSnippetEditor()

  return (
    <ul className={GRID_CLASSES} aria-label="Snippets">
      {snippets.map((snippet) => (
        // `grid` makes the card fill the row height, so cards in a row line up.
        <li key={snippet.id} className="grid">
          <SnippetCard
            snippet={snippet}
            collection={snippet.collectionId ? collectionsById.get(snippet.collectionId) : undefined}
            onOpen={openEdit}
          />
        </li>
      ))}
    </ul>
  )
}

export function SnippetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES} role="status" aria-label="Loading snippets">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-xl border bg-card p-4">
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
