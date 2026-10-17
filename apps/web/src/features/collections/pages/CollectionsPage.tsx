import { Link } from 'react-router'
import { m } from 'motion/react'
import { FolderOpen, FolderPlus, Plus } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDelayedFlag } from '@/hooks/use-delayed-flag'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useLibrary } from '@/features/library/library-context'
import { LIFT_ON_HOVER, TILE_GRID } from '@/lib/layout'
import { STAGGER_LIMIT, STAGGER_STEP, TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { COLLECTION_COLOR_CLASSES } from '../collection-colors'
import { CollectionActionsMenu } from '../components/CollectionActionsMenu'
import { useCollectionEditor } from '../editor/collection-editor-context'

export function CollectionsPage() {
  const { collections, counts, isLoading } = useLibrary()
  const { create } = useCollectionEditor()
  const showSkeleton = useDelayedFlag(isLoading)
  useDocumentTitle('Collections')

  if (isLoading) {
    return showSkeleton ? (
      <div className={TILE_GRID} role="status" aria-label="Loading collections">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    ) : null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description={`${collections.length} collection${collections.length === 1 ? '' : 's'}`}
        actions={
          <Button onClick={() => create()}>
            <Plus aria-hidden="true" />
            New collection
          </Button>
        }
      />

      {collections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No collections yet"
          description="Collections group related snippets — for example Git, SQL or Email templates."
        >
          <Button onClick={() => create()}>
            <FolderPlus aria-hidden="true" />
            Create a collection
          </Button>
        </EmptyState>
      ) : (
        <ul className={TILE_GRID}>
          {collections.map((collection, index) => {
            const count = counts.byCollection.get(collection.id) ?? 0
            const colors = COLLECTION_COLOR_CLASSES[collection.color]
            return (
              <m.li
                key={collection.id}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...TRANSITION.base,
                  delay: Math.min(index, STAGGER_LIMIT) * STAGGER_STEP,
                  layout: TRANSITION.layout,
                }}
                className="group/tile relative grid"
              >
                <Link
                  to={`/collections/${collection.id}`}
                  className={cn(
                    'relative flex items-center gap-4 rounded-2xl border bg-card p-4 pr-12 shadow-xs focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    LIFT_ON_HOVER,
                  )}
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
                <CollectionActionsMenu
                  collection={collection}
                  triggerClassName="absolute top-3 right-3 opacity-0 transition-opacity group-focus-within/tile:opacity-100 group-hover/tile:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
                />
              </m.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
