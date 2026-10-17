import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Clock, FolderOpen, FolderX, Hash, Loader2, Plus, SearchX, Sparkles, Star, X } from 'lucide-react'
import { ColorDot } from '@/components/ColorDot'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useLibrary } from '@/features/library/library-context'
import { useLoadSampleData } from '@/features/library/use-load-sample-data'
import { SnippetGrid, SnippetGridSkeleton } from '../components/SnippetGrid'
import {
  RECENT_LIMIT,
  parseTagParam,
  selectSnippets,
  tagFilterHref,
  type SnippetView,
} from '../lib/select-snippets'
import { useNewSnippet } from '../use-new-snippet'

type SnippetsPageProps = {
  view: 'all' | 'favorites' | 'recent' | 'collection'
}

function pluralize(count: number, word: string) {
  return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`
}

export function SnippetsPage({ view: viewKind }: SnippetsPageProps) {
  const { collectionId } = useParams()
  const [searchParams] = useSearchParams()
  const { snippets, collectionsById, isLoading } = useLibrary()
  const newSnippet = useNewSnippet()
  const sampleData = useLoadSampleData()

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

  const title =
    viewKind === 'favorites'
      ? 'Favorites'
      : viewKind === 'recent'
        ? 'Recent'
        : viewKind === 'collection'
          ? (collection?.name ?? 'Collection')
          : 'All snippets'

  useDocumentTitle(title)

  if (viewKind === 'collection' && !isLoading && !collection) {
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

  const description = isLoading
    ? 'Loading…'
    : viewKind === 'recent'
      ? `Your ${RECENT_LIMIT} most recently used or edited snippets`
      : pluralize(visible.length, 'snippet')

  const newButton = (
    <Button
      onClick={newSnippet}
      className="hidden h-9 gap-1.5 px-3 shadow-sm shadow-primary/20 md:inline-flex"
    >
      <Plus aria-hidden="true" />
      New snippet
    </Button>
  )

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
        actions={newButton}
      />

      {tagFilter.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
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
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link to="/">Clear</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <SnippetGridSkeleton />
      ) : snippets.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Your library is empty"
          description="Save the commands, queries and message templates you reuse — then copy any of them in one click."
        >
          <Button onClick={newSnippet} className="h-10 gap-1.5 sm:h-9">
            <Plus aria-hidden="true" />
            Create your first snippet
          </Button>
          <Button
            variant="outline"
            className="h-10 sm:h-9"
            onClick={sampleData.load}
            disabled={sampleData.isLoading}
          >
            {sampleData.isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
            Load sample snippets
          </Button>
        </EmptyState>
      ) : visible.length === 0 ? (
        <ViewEmptyState viewKind={viewKind} hasTagFilter={tagFilter.length > 0} onNew={newSnippet} />
      ) : (
        <SnippetGrid snippets={visible} collectionsById={collectionsById} />
      )}
    </div>
  )
}

function ViewEmptyState({
  viewKind,
  hasTagFilter,
  onNew,
}: {
  viewKind: SnippetsPageProps['view']
  hasTagFilter: boolean
  onNew: () => void
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
          <Button onClick={onNew} className="gap-1.5">
            <Plus aria-hidden="true" />
            New snippet
          </Button>
        </EmptyState>
      )
    case 'all':
      return null
  }
}
