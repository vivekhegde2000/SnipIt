import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, m } from 'motion/react'
import { Clock, FolderOpen, FolderX, Hash, Plus, SearchX, Star, X } from 'lucide-react'
import { ColorDot } from '@/components/ColorDot'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useDelayedFlag } from '@/hooks/use-delayed-flag'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useLibrary } from '@/features/library/library-context'
import { TRANSITION } from '@/lib/motion'
import { LibraryWelcome } from '../components/LibraryWelcome'
import { SnippetGrid, SnippetGridSkeleton } from '../components/SnippetGrid'
import {
  RECENT_LIMIT,
  parseTagParam,
  selectSnippets,
  tagFilterHref,
  type SnippetView,
} from '../lib/select-snippets'
import { useNewSnippet, type NewSnippetTrigger } from '../use-new-snippet'

type ViewKind = 'all' | 'favorites' | 'recent' | 'collection'

type SnippetsPageProps = {
  view: ViewKind
}

const VIEW_TITLES: Record<Exclude<ViewKind, 'collection'>, string> = {
  all: 'All snippets',
  favorites: 'Favorites',
  recent: 'Recent',
}

function pluralize(count: number, word: string) {
  return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`
}

export function SnippetsPage({ view: viewKind }: SnippetsPageProps) {
  const { collectionId } = useParams()
  const [searchParams] = useSearchParams()
  const { snippets, collectionsById, isLoading } = useLibrary()
  const newSnippet = useNewSnippet()
  // IndexedDB usually answers in a few ms; only show a skeleton if it is genuinely slow.
  const showSkeleton = useDelayedFlag(isLoading)

  const collection = viewKind === 'collection' && collectionId ? collectionsById.get(collectionId) : undefined
  const tagFilter = useMemo(
    () => (viewKind === 'all' ? parseTagParam(searchParams) : []),
    [viewKind, searchParams],
  )

  const view = useMemo<SnippetView>(() => {
    if (viewKind === 'collection') return { kind: 'collection', collectionId: collectionId ?? '' }
    return { kind: viewKind }
  }, [viewKind, collectionId])

  const visible = useMemo(
    () => selectSnippets(snippets, view, { tags: tagFilter }),
    [snippets, view, tagFilter],
  )

  const title = viewKind === 'collection' ? (collection?.name ?? 'Collection') : VIEW_TITLES[viewKind]
  useDocumentTitle(title)

  if (isLoading) {
    return showSkeleton ? <SnippetGridSkeleton /> : null
  }

  if (snippets.length === 0) {
    return <LibraryWelcome trigger={newSnippet} />
  }

  if (viewKind === 'collection' && !collection) {
    return (
      <EmptyState
        icon={FolderX}
        title="Collection not found"
        description="It may have been deleted, or the link is incorrect."
        className="mt-8"
      >
        <Button asChild variant="outline">
          <Link to="/collections">Browse collections</Link>
        </Button>
      </EmptyState>
    )
  }

  const description =
    viewKind === 'recent'
      ? `Your ${RECENT_LIMIT} most recently used or edited snippets`
      : pluralize(visible.length, 'snippet')

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          collection ? (
            <span className="inline-flex items-center gap-2.5">
              {collection.icon ? (
                <span aria-hidden="true">{collection.icon}</span>
              ) : (
                <ColorDot color={collection.color} className="size-3" />
              )}
              {collection.name}
            </span>
          ) : (
            title
          )
        }
        description={description}
        actions={
          // Phones use the floating button instead.
          <Button className="hidden md:inline-flex" {...newSnippet.triggerProps}>
            <Plus aria-hidden="true" />
            New snippet
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {tagFilter.length > 0 && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={TRANSITION.base}
            className="-mt-2 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 pt-2" aria-label="Active filters">
              <span className="text-sm text-muted-foreground">Tagged</span>
              {tagFilter.map((tag) => (
                <Link
                  key={tag}
                  to={tagFilterHref(tagFilter.filter((t) => t !== tag))}
                  aria-label={`Remove tag filter ${tag}`}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-primary/30 bg-accent pr-1.5 pl-2.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Hash className="size-3 opacity-60" aria-hidden="true" />
                  {tag}
                  <X className="size-3.5" aria-hidden="true" />
                </Link>
              ))}
              <Button asChild variant="ghost" size="xs">
                <Link to="/">Clear</Link>
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {visible.length === 0 ? (
        <ViewEmptyState viewKind={viewKind} hasTagFilter={tagFilter.length > 0} trigger={newSnippet} />
      ) : (
        <SnippetGrid snippets={visible} collectionsById={collectionsById} />
      )}
    </div>
  )
}

function ViewEmptyState({
  viewKind,
  hasTagFilter,
  trigger,
}: {
  viewKind: ViewKind
  hasTagFilter: boolean
  trigger: NewSnippetTrigger
}) {
  if (hasTagFilter) {
    return (
      <EmptyState
        icon={SearchX}
        title="No snippets match these tags"
        description="Try removing a tag filter."
      >
        <Button asChild variant="outline">
          <Link to="/">Clear filters</Link>
        </Button>
      </EmptyState>
    )
  }

  switch (viewKind) {
    case 'favorites':
      return (
        <EmptyState
          icon={Star}
          title="No favorites yet"
          description="Star the snippets you use most and they'll be waiting for you here."
        />
      )
    case 'recent':
      return (
        <EmptyState
          icon={Clock}
          title="Nothing recent"
          description="Snippets you copy or edit will show up here."
        />
      )
    case 'collection':
      return (
        <EmptyState
          icon={FolderOpen}
          title="This collection is empty"
          description="Add a snippet to get it started."
        >
          <Button {...trigger.triggerProps}>
            <Plus aria-hidden="true" />
            New snippet
          </Button>
        </EmptyState>
      )
    case 'all':
      return null
  }
}
