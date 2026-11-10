import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { m } from 'motion/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FolderOpen, FolderPlus, GripVertical, Plus } from 'lucide-react'
import type { Collection } from '@snipit/shared'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDelayedFlag } from '@/hooks/use-delayed-flag'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useLibrary } from '@/features/library/library-context'
import { useEntranceAnimation } from '@/lib/initial-screen'
import { LIFT_ON_HOVER, TILE_GRID } from '@/lib/layout'
import { STAGGER_LIMIT, STAGGER_STEP, TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { COLLECTION_COLOR_CLASSES } from '../collection-colors'
import { CollectionActionsMenu } from '../components/CollectionActionsMenu'
import { useCollectionEditor } from '../editor/collection-editor-context'
import { useCollectionOrder } from '../use-collection-order'

const sameOrder = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index])

/**
 * Collections, in the order used everywhere (sidebar, pickers, filters). Drag a tile by its
 * handle to reorder — mouse, touch, or keyboard (Space to pick up, arrows to move, Space to drop,
 * Esc to cancel). The ⋯ menu also has Move up / Move down.
 *
 * Lazy route: dnd-kit is only downloaded with this page (and precached for offline use).
 */
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
        description={
          collections.length > 1
            ? `${collections.length} collections · drag to reorder`
            : `${collections.length} collection${collections.length === 1 ? '' : 's'}`
        }
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
        <SortableCollectionGrid collections={collections} counts={counts.byCollection} />
      )}
    </div>
  )
}

function SortableCollectionGrid({
  collections,
  counts,
}: {
  collections: readonly Collection[]
  counts: ReadonlyMap<string, number>
}) {
  const order = useCollectionOrder()
  const enter = useEntranceAnimation()
  const byId = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections])
  const savedIds = useMemo(() => collections.map((c) => c.id), [collections])
  /** The dropped order, shown until the database confirms it (no flicker back). */
  const [pending, setPending] = useState<string[] | null>(null)
  if (pending && sameOrder(pending, savedIds)) setPending(null)

  // Collections added or removed meanwhile (another tab) are reconciled with the pending order.
  const ids = pending
    ? [...pending.filter((id) => byId.has(id)), ...savedIds.filter((id) => !pending.includes(id))]
    : savedIds

  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    // A small distance lets a plain click on the handle do nothing instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const nameOf = (id: string | number) => byId.get(String(id))?.name ?? 'Collection'
  const positionOf = (id: string | number) => ids.indexOf(String(id)) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${nameOf(active.id)}. Position ${positionOf(active.id)} of ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} moved to position ${positionOf(over.id)} of ${ids.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} dropped at position ${positionOf(over.id)} of ${ids.length}.`
        : `${nameOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Reordering cancelled. ${nameOf(active.id)} is back in its place.`,
  }
  const instructions: ScreenReaderInstructions = {
    draggable:
      'To reorder, press Space or Enter to pick up the collection, use the arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.',
  }

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id))
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    setPending(next)
    const saved = await order.save(next, nameOf(active.id))
    if (!saved) setPending(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={(event) => void onDragEnd(event)}
      onDragCancel={() => setActiveId(null)}
      accessibility={{ announcements, screenReaderInstructions: instructions }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={TILE_GRID} aria-label="Collections">
          {ids.map((id, index) => {
            const collection = byId.get(id)
            if (!collection) return null
            return (
              <SortableTile
                key={id}
                collection={collection}
                count={counts.get(id) ?? 0}
                // Stagger the first visit's entrance; dragging must not replay it.
                entranceDelay={enter ? Math.min(index, STAGGER_LIMIT) * STAGGER_STEP : null}
                isAnyDragging={activeId !== null}
              />
            )
          })}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableTile({
  collection,
  count,
  entranceDelay,
  isAnyDragging,
}: {
  collection: Collection
  count: number
  /** `null` = no entrance animation. */
  entranceDelay: number | null
  isAnyDragging: boolean
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: collection.id })
  const colors = COLLECTION_COLOR_CLASSES[collection.color]
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    // `minmax(0, 1fr)` tracks (grid-cols-1) let a long collection name truncate instead of
    // widening the tile past a phone screen.
    <li
      ref={setNodeRef}
      style={style}
      className={cn('group/tile relative grid min-w-0 grid-cols-1', isDragging && 'z-20')}
    >
      <m.div
        initial={entranceDelay === null ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TRANSITION.base, delay: entranceDelay ?? 0 }}
        className="relative grid min-w-0 grid-cols-1"
      >
        <Link
          to={`/collections/${collection.id}`}
          className={cn(
            'relative flex items-center gap-4 rounded-2xl border bg-card p-4 pr-22 shadow-xs focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
            !isAnyDragging && LIFT_ON_HOVER,
            isDragging && 'border-primary/50 shadow-xl ring-2 ring-primary/30',
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

        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-0.5">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${collection.name}`}
            className={cn(
              'grid size-8 cursor-grab touch-none place-items-center rounded-lg text-muted-foreground transition-[opacity,color,background-color] duration-150 hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing pointer-coarse:size-9',
              isDragging
                ? 'cursor-grabbing bg-muted text-foreground opacity-100'
                : 'opacity-0 group-focus-within/tile:opacity-100 group-hover/tile:opacity-100 pointer-coarse:opacity-100',
            )}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          <CollectionActionsMenu
            collection={collection}
            triggerClassName={cn(
              'transition-opacity',
              isDragging
                ? 'opacity-0'
                : 'opacity-0 group-focus-within/tile:opacity-100 group-hover/tile:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100',
            )}
          />
        </div>
      </m.div>
    </li>
  )
}
