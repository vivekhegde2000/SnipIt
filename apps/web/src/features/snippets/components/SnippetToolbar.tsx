import { useRef, type KeyboardEvent } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ArrowDownUp, FolderOpen, Hash, Search, Star, X } from 'lucide-react'
import { LANGUAGES, getLanguageLabel, type LanguageId } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { Kbd } from '@/components/Kbd'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLibrary } from '@/features/library/library-context'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  CLEARED_FILTERS,
  SORT_OPTIONS,
  countActiveFilters,
  effectiveSort,
  type SnippetQuery,
  type SnippetView,
  type SortKey,
} from '../lib/select-snippets'
import { SEARCH_INPUT_ID } from '../search-input'
import { TagFilter } from './TagFilter'

const ALL = '__all__'

type SnippetToolbarProps = {
  view: SnippetView
  query: SnippetQuery
  searchText: string
  onSearchTextChange: (value: string) => void
  onQueryChange: (patch: Partial<SnippetQuery>) => void
}

function FilterChip({
  label,
  onRemove,
  children,
}: {
  label: string
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    // No `layout`: the toolbar re-renders on every keystroke, and layout projection would
    // re-measure the page each time.
    <m.button
      type="button"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: TRANSITION.fast }}
      transition={TRANSITION.pop}
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-primary/30 bg-accent pr-1.5 pl-2.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {children}
      <X className="size-3.5 opacity-70" aria-hidden="true" />
    </m.button>
  )
}

/** Search + filters + sort for snippet lists. All state lives in the URL (see `useSnippetQuery`). */
export function SnippetToolbar({
  view,
  query,
  searchText,
  onSearchTextChange,
  onQueryChange,
}: SnippetToolbarProps) {
  const { tags, collections, collectionsById } = useLibrary()
  const inputRef = useRef<HTMLInputElement>(null)
  const isSearching = searchText.trim().length > 0
  const sort = effectiveSort(view, query, isSearching)
  const sortOptions = SORT_OPTIONS.filter((option) => option.value !== 'relevance' || isSearching)
  const activeFilters = countActiveFilters(query)
  const filterCollection = query.collectionId ? collectionsById.get(query.collectionId) : undefined

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') return
    // First Escape clears the text, the second leaves the field.
    event.preventDefault()
    if (searchText) onSearchTextChange('')
    else inputRef.current?.blur()
  }

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 space-y-3 border-b bg-background/90 px-4 py-3 backdrop-blur-md supports-backdrop-filter:bg-background/75 sm:-mx-6 sm:px-6 md:top-0 md:-mx-8 md:px-8 2xl:-mx-12 2xl:px-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative min-w-0 md:max-w-md md:flex-1 xl:max-w-xl">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id={SEARCH_INPUT_ID}
            type="search"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search snippets…"
            aria-label="Search snippets"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="peer h-9 w-full rounded-lg border border-input bg-card pr-16 pl-9 text-base shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 pointer-coarse:h-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchText ? (
            <button
              type="button"
              onClick={() => {
                onSearchTextChange('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <Kbd
              keys={['/']}
              className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 peer-focus:hidden md:inline-flex"
            />
          )}
        </div>

        {/* Filters — a single swipeable row on phones */}
        <div className="-mx-4 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-4 pb-0.5 md:mx-0 md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          <Select
            value={query.language ?? ALL}
            onValueChange={(value) =>
              onQueryChange({ language: value === ALL ? null : (value as LanguageId) })
            }
          >
            <SelectTrigger
              aria-label="Filter by language"
              className={cn(
                'shrink-0',
                query.language && 'border-primary/40 bg-accent text-accent-foreground',
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              <SelectItem value={ALL}>All languages</SelectItem>
              {LANGUAGES.map((language) => (
                <SelectItem key={language.id} value={language.id}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TagFilter tags={tags} selected={query.tags} onChange={(next) => onQueryChange({ tags: next })} />

          {view.kind === 'all' && collections.length > 0 && (
            <Select
              value={query.collectionId ?? ALL}
              onValueChange={(value) => onQueryChange({ collectionId: value === ALL ? null : value })}
            >
              <SelectTrigger
                aria-label="Filter by collection"
                className={cn(
                  'shrink-0',
                  query.collectionId && 'border-primary/40 bg-accent text-accent-foreground',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                <SelectItem value={ALL}>
                  <FolderOpen className="text-muted-foreground" aria-hidden="true" />
                  All collections
                </SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    <ColorDot color={collection.color} />
                    <span className="truncate">{collection.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {view.kind !== 'favorites' && (
            <Button
              variant="outline"
              aria-pressed={query.favorites}
              onClick={() => onQueryChange({ favorites: !query.favorites })}
              className={cn(
                'shrink-0',
                query.favorites && 'border-favorite/50 bg-favorite/10 text-foreground',
              )}
            >
              <Star className={cn(query.favorites && 'fill-favorite text-favorite')} aria-hidden="true" />
              Favorites
            </Button>
          )}

          {view.kind !== 'recent' && (
            <Select value={sort} onValueChange={(value) => onQueryChange({ sort: value as SortKey })}>
              <SelectTrigger aria-label="Sort snippets" className="shrink-0 md:ml-auto">
                <ArrowDownUp className="text-muted-foreground" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      <AnimatePresence initial={false}>
        {activeFilters > 0 && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={TRANSITION.base}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
              <AnimatePresence initial={false}>
                {query.language && (
                  <FilterChip
                    key="lang"
                    label={getLanguageLabel(query.language)}
                    onRemove={() => onQueryChange({ language: null })}
                  >
                    {getLanguageLabel(query.language)}
                  </FilterChip>
                )}
                {filterCollection && (
                  <FilterChip
                    key="col"
                    label={filterCollection.name}
                    onRemove={() => onQueryChange({ collectionId: null })}
                  >
                    <ColorDot color={filterCollection.color} className="size-2" />
                    {filterCollection.name}
                  </FilterChip>
                )}
                {query.favorites && (
                  <FilterChip
                    key="fav"
                    label="Favorites"
                    onRemove={() => onQueryChange({ favorites: false })}
                  >
                    <Star className="size-3 fill-favorite text-favorite" aria-hidden="true" />
                    Favorites
                  </FilterChip>
                )}
                {query.tags.map((tag) => (
                  <FilterChip
                    key={`tag-${tag}`}
                    label={`#${tag}`}
                    onRemove={() => onQueryChange({ tags: query.tags.filter((t) => t !== tag) })}
                  >
                    <Hash className="size-3 opacity-60" aria-hidden="true" />
                    {tag}
                  </FilterChip>
                ))}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onSearchTextChange('')
                  onQueryChange(CLEARED_FILTERS)
                }}
              >
                Clear all
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
