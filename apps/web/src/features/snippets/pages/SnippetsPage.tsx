import { useCallback, useDeferredValue, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Clock, FolderOpen, FolderX, Plus, SearchX, Star } from 'lucide-react'
import { ColorDot } from '@/components/ColorDot'
import { EmptyState } from '@/components/EmptyState'
import { Kbd } from '@/components/Kbd'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { BackupReminder } from '@/features/backup/components/BackupReminder'
import { CollectionActionsMenu } from '@/features/collections/components/CollectionActionsMenu'
import { useLibrary } from '@/features/library/library-context'
import { useDelayedFlag } from '@/hooks/use-delayed-flag'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { LibraryWelcome } from '../components/LibraryWelcome'
import { SnippetGrid, SnippetGridSkeleton } from '../components/SnippetGrid'
import { SnippetToolbar } from '../components/SnippetToolbar'
import { useSearchText } from '../hooks/use-search-text'
import { useSnippetQuery } from '../hooks/use-snippet-query'
import {
  CLEARED_FILTERS,
  RECENT_LIMIT,
  countActiveFilters,
  selectSnippets,
  type SnippetQuery,
  type SnippetView,
} from '../lib/select-snippets'
import { createSnippetIndex, searchSnippets, type SearchHit } from '../lib/snippet-search'
import { useNewSnippet, type NewSnippetTrigger } from '../use-new-snippet'

type ViewKind = SnippetView['kind']

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
  const { snippets, collectionsById, isLoading } = useLibrary()
  const newSnippet = useNewSnippet()
  const { query, update } = useSnippetQuery()
  const commitSearch = useCallback((q: string) => update({ q }), [update])
  const [searchText, setSearchText] = useSearchText(query.q, commitSearch)
  // Typing stays responsive: filtering a large library runs at lower priority than the input.
  const deferredSearch = useDeferredValue(searchText.trim())
  // IndexedDB usually answers in a few ms; only show a skeleton if it is genuinely slow.
  const showSkeleton = useDelayedFlag(isLoading)

  const collection = viewKind === 'collection' && collectionId ? collectionsById.get(collectionId) : undefined

  const view = useMemo<SnippetView>(
    () =>
      viewKind === 'collection'
        ? { kind: 'collection', collectionId: collectionId ?? '' }
        : { kind: viewKind },
    [viewKind, collectionId],
  )

  // The fuzzy index is only built while searching, and rebuilt only when the library changes.
  const isSearching = deferredSearch.length > 0
  const index = useMemo(() => (isSearching ? createSnippetIndex(snippets) : null), [isSearching, snippets])
  const hits = useMemo(() => (index ? searchSnippets(index, deferredSearch) : null), [index, deferredSearch])

  const effectiveQuery = useMemo<SnippetQuery>(
    () => ({ ...query, q: deferredSearch }),
    [query, deferredSearch],
  )
  const visible = useMemo(
    () => selectSnippets(snippets, view, effectiveQuery, hits),
    [snippets, view, effectiveQuery, hits],
  )
  const viewTotal = useMemo(
    () => selectSnippets(snippets, view, { ...effectiveQuery, ...CLEARED_FILTERS }, null).length,
    [snippets, view, effectiveQuery],
  )

  // Any change to what is listed restarts incremental rendering at the first batch.
  const gridResetKey = useMemo(() => JSON.stringify([view, effectiveQuery]), [view, effectiveQuery])

  const titleMatches = useMemo(() => {
    if (!hits) return undefined
    const matches = new Map<string, NonNullable<SearchHit['titleMatches']>>()
    for (const [id, hit] of hits) if (hit.titleMatches) matches.set(id, hit.titleMatches)
    return matches
  }, [hits])

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

  const isFiltered = isSearching || countActiveFilters(query) > 0
  const description =
    viewKind === 'recent' && !isFiltered
      ? `Your ${RECENT_LIMIT} most recently used or edited snippets`
      : isFiltered
        ? `${visible.length.toLocaleString()} of ${pluralize(viewTotal, 'snippet')}`
        : pluralize(visible.length, 'snippet')

  const clearAll = () => {
    setSearchText('')
    update(CLEARED_FILTERS)
  }

  return (
    <div className="space-y-5">
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
        description={<span aria-live="polite">{description}</span>}
        actions={
          <>
            {collection && <CollectionActionsMenu collection={collection} triggerSize="icon" />}
            {/* Phones use the floating button instead. */}
            <Button className="hidden md:inline-flex" {...newSnippet.triggerProps}>
              <Plus aria-hidden="true" />
              New snippet
              <Kbd keys={['N']} className="ml-1 border-white/20 bg-white/15 text-primary-foreground" />
            </Button>
          </>
        }
      />

      {viewKind === 'all' && <BackupReminder />}

      <SnippetToolbar
        view={view}
        query={query}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onQueryChange={update}
      />

      {visible.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={SearchX}
            title={isSearching ? `No snippets match “${deferredSearch}”` : 'No snippets match these filters'}
            description="Try different words or remove some filters."
          >
            <Button variant="outline" onClick={clearAll}>
              Clear search and filters
            </Button>
          </EmptyState>
        ) : (
          <ViewEmptyState viewKind={viewKind} trigger={newSnippet} />
        )
      ) : (
        <SnippetGrid
          snippets={visible}
          collectionsById={collectionsById}
          titleMatches={titleMatches}
          resetKey={gridResetKey}
        />
      )}
    </div>
  )
}

function ViewEmptyState({ viewKind, trigger }: { viewKind: ViewKind; trigger: NewSnippetTrigger }) {
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
