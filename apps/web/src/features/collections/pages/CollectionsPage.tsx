import { Link } from 'react-router'
import { FolderOpen, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useLibrary } from '@/features/library/library-context'
import { useLoadSampleData } from '@/features/library/use-load-sample-data'
import { cn } from '@/lib/utils'
import { COLLECTION_COLOR_CLASSES } from '../collection-colors'

export function CollectionsPage() {
  const { collections, counts, isLoading } = useLibrary()
  const sampleData = useLoadSampleData()
  useDocumentTitle('Collections')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description={
          isLoading ? 'Loading…' : `${collections.length} collection${collections.length === 1 ? '' : 's'}`
        }
      />

      {isLoading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="status"
          aria-label="Loading collections"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No collections yet"
          description="Collections group related snippets — for example Git, SQL or Email templates."
        >
          <Button variant="outline" onClick={sampleData.load} disabled={sampleData.isLoading}>
            {sampleData.isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
            Load sample snippets
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((collection) => {
            const count = counts.byCollection.get(collection.id) ?? 0
            const colors = COLLECTION_COLOR_CLASSES[collection.color]
            return (
              <li key={collection.id} className="grid">
                <Link
                  to={`/collections/${collection.id}`}
                  className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span
                    className={cn('grid size-12 shrink-0 place-items-center rounded-xl text-xl', colors.soft)}
                    aria-hidden="true"
                  >
                    {collection.icon ?? <FolderOpen className="size-5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{collection.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} snippet{count === 1 ? '' : 's'}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
