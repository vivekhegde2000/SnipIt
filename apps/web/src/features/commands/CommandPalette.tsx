import { Fragment, useDeferredValue, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Command } from 'cmdk'
import {
  Clock,
  Download,
  FileCode2,
  FolderOpen,
  FolderPlus,
  Keyboard,
  Layers,
  Monitor,
  MonitorDown,
  Moon,
  Plus,
  Search,
  Settings,
  Star,
  Sun,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { getLanguageLabel, type Snippet } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { HighlightText } from '@/components/HighlightText'
import { Kbd } from '@/components/Kbd'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useTheme } from '@/app/theme/theme-context'
import { useBackup } from '@/features/backup/backup-context'
import { useCollectionEditor } from '@/features/collections/editor/collection-editor-context'
import { promptInstall, useInstallState } from '@/features/pwa/install-prompt'
import { useLibrary } from '@/features/library/library-context'
import { useSnippetActions } from '@/features/snippets/actions/use-snippet-actions'
import { useSnippetEditor } from '@/features/snippets/editor/snippet-editor-context'
import { createSnippetIndex, searchSnippets, type SearchHit } from '@/features/snippets/lib/snippet-search'
import { isModKey } from '@/lib/platform'
import { cn } from '@/lib/utils'

const MAX_SNIPPET_RESULTS = 25
const RECENT_COUNT = 8

type SnippetResult = { snippet: Snippet; titleMatches?: SearchHit['titleMatches'] }

type PaletteAction = {
  id: string
  label: string
  icon: LucideIcon
  keys?: string[][]
  keywords?: string
  run: () => void
}

type Section = 'snippets' | 'collections' | 'actions'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShowShortcuts: () => void
}

const itemClasses =
  'group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none select-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground pointer-coarse:py-3'

const groupClasses =
  'px-2 py-1.5 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:uppercase'

const iconBoxClasses =
  'grid size-9 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground'

const lastActivity = (s: Snippet) => Math.max(s.updatedAt, s.lastCopiedAt ?? 0)

/** Every term appears somewhere in the text. */
function containsAll(text: string, terms: readonly string[]) {
  const haystack = text.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

/** Every term starts a word of the text ("set" → "Open Settings") — a strong, intentional match. */
function startsWords(text: string, terms: readonly string[]) {
  const words = text.toLowerCase().split(/[\s\-_/]+/)
  return terms.every((term) => words.some((word) => word.startsWith(term)))
}

/** Ctrl/⌘+K: find any snippet and copy it with Enter, or run an app command. */
export function CommandPalette({ open, onOpenChange, onShowShortcuts }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { snippets, collections, collectionsById } = useLibrary()
  const actions = useSnippetActions()
  const { openCreate } = useSnippetEditor()
  const collectionEditor = useCollectionEditor()
  const { setTheme } = useTheme()
  const backup = useBackup()
  const { canInstall } = useInstallState()
  const [search, setSearch] = useState('')
  /** User's highlighted item, remembered per query (so a new query starts at its best match). */
  const [selection, setSelection] = useState<{ value: string; query: string }>({ value: '', query: '' })
  const query = useDeferredValue(search.trim())
  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])

  // Every opening starts fresh, however the palette was closed last time (Enter, Esc, outside
  // click, Ctrl+K toggle). "Adjust state while rendering" — no effect, no flash of stale text.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSearch('')
      setSelection({ value: '', query: '' })
    }
  }

  const close = () => onOpenChange(false)
  const runAndClose = (run: () => void) => {
    close()
    run()
  }

  // The index is built when searching starts and rebuilt only when the library changes.
  const isSearching = query.length > 0
  const index = useMemo(
    () => (open && isSearching ? createSnippetIndex(snippets) : null),
    [open, isSearching, snippets],
  )
  // Snippets: search results while typing, otherwise the most recently used ones.
  const snippetResults = useMemo<SnippetResult[]>(() => {
    if (!index || !query) {
      return [...snippets]
        .sort((a, b) => lastActivity(b) - lastActivity(a))
        .slice(0, RECENT_COUNT)
        .map((snippet) => ({ snippet }))
    }
    const byId = new Map(snippets.map((s) => [s.id, s]))
    return [...searchSnippets(index, query)]
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, MAX_SNIPPET_RESULTS)
      .flatMap(([id, hit]) => {
        const snippet = byId.get(id)
        return snippet ? [{ snippet, titleMatches: hit.titleMatches }] : []
      })
  }, [index, query, snippets])

  const paletteActions = useMemo<PaletteAction[]>(() => {
    const go = (to: string) => () => navigate(to)
    return [
      {
        id: 'new-snippet',
        label: 'New snippet',
        icon: Plus,
        keys: [['N']],
        keywords: 'create add',
        run: () => openCreate(),
      },
      {
        id: 'new-collection',
        label: 'New collection',
        icon: FolderPlus,
        keywords: 'create add folder group',
        run: () => collectionEditor.create(),
      },
      {
        id: 'go-all',
        label: 'Go to All snippets',
        icon: Layers,
        keys: [['G'], ['A']],
        keywords: 'library home',
        run: go('/'),
      },
      {
        id: 'go-favorites',
        label: 'Go to Favorites',
        icon: Star,
        keys: [['G'], ['F']],
        keywords: 'starred',
        run: go('/favorites'),
      },
      {
        id: 'go-recent',
        label: 'Go to Recent',
        icon: Clock,
        keys: [['G'], ['R']],
        keywords: 'history used',
        run: go('/recent'),
      },
      {
        id: 'go-collections',
        label: 'Go to Collections',
        icon: FolderOpen,
        keys: [['G'], ['C']],
        keywords: 'folders',
        run: go('/collections'),
      },
      {
        id: 'go-settings',
        label: 'Open Settings',
        icon: Settings,
        keys: [['G'], ['S']],
        keywords: 'preferences options delete data',
        run: go('/settings'),
      },
      {
        id: 'theme-light',
        label: 'Switch to light theme',
        icon: Sun,
        keywords: 'appearance mode',
        run: () => setTheme('light'),
      },
      {
        id: 'theme-dark',
        label: 'Switch to dark theme',
        icon: Moon,
        keywords: 'appearance mode night',
        run: () => setTheme('dark'),
      },
      {
        id: 'theme-system',
        label: 'Use system theme',
        icon: Monitor,
        keywords: 'appearance mode auto',
        run: () => setTheme('system'),
      },
      {
        id: 'shortcuts',
        label: 'Keyboard shortcuts',
        icon: Keyboard,
        keys: [['?']],
        keywords: 'help hotkeys keys',
        run: onShowShortcuts,
      },
      {
        id: 'export-backup',
        label: 'Export backup',
        icon: Download,
        keywords: 'save download json backup',
        run: () => void backup.exportAll(),
      },
      {
        id: 'import-backup',
        label: 'Import backup',
        icon: Upload,
        keywords: 'restore load json upload',
        run: backup.chooseImportFile,
      },
      ...(canInstall
        ? [
            {
              id: 'install',
              label: 'Install SnipIt app',
              icon: MonitorDown,
              keywords: 'pwa desktop home screen offline',
              run: () => void promptInstall(),
            },
          ]
        : []),
    ]
  }, [navigate, openCreate, collectionEditor, setTheme, onShowShortcuts, backup, canInstall])

  const visibleActions = terms.length
    ? paletteActions.filter((action) => containsAll(`${action.label} ${action.keywords ?? ''}`, terms))
    : paletteActions
  const visibleCollections = terms.length ? collections.filter((c) => containsAll(c.name, terms)) : []
  const hasResults = snippetResults.length + visibleActions.length + visibleCollections.length > 0

  // Section order: a command or collection whose *name* the user is typing beats fuzzy snippet
  // matches ("settings" → Open Settings, not a snippet that mentions "meetings").
  const order: Section[] = []
  if (terms.length && visibleActions.some((a) => startsWords(a.label, terms))) order.push('actions')
  if (terms.length && visibleCollections.some((c) => startsWords(c.name, terms))) order.push('collections')
  for (const section of ['snippets', 'collections', 'actions'] as const) {
    if (!order.includes(section)) order.push(section)
  }

  const sectionValues: Record<Section, string[]> = {
    snippets: snippetResults.map(({ snippet }) => `snippet:${snippet.id}`),
    collections: visibleCollections.map((c) => `collection:${c.id}`),
    actions: visibleActions.map((a) => `action:${a.id}`),
  }
  // "Create snippet …" is the fallback, so it always comes last.
  const values = [...order.flatMap((section) => sectionValues[section]), ...(query ? ['create'] : [])]

  // Results update a beat after typing (deferred), so cmdk's own "select first item" can point at
  // an item that no longer exists. Derive the selection instead: keep the user's choice while it
  // is still listed for this query, otherwise highlight the top result.
  const selected =
    selection.query === query && values.includes(selection.value) ? selection.value : (values[0] ?? '')

  // Mod+Enter on a snippet opens its details instead of copying it.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || !isModKey(event) || !selected.startsWith('snippet:')) return
    event.preventDefault()
    const result = snippetResults.find(({ snippet }) => `snippet:${snippet.id}` === selected)
    if (result) runAndClose(() => actions.open(result.snippet))
  }

  const sections: Record<Section, ReactNode> = {
    snippets: snippetResults.length > 0 && (
      <Command.Group heading={query ? 'Snippets' : 'Recent snippets'} className={groupClasses}>
        {snippetResults.map(({ snippet, titleMatches }) => {
          const collection = snippet.collectionId ? collectionsById.get(snippet.collectionId) : undefined
          const subtitle = snippet.description || snippet.content.split('\n', 1)[0]
          return (
            <Command.Item
              key={snippet.id}
              value={`snippet:${snippet.id}`}
              onSelect={async () => {
                // Copy first (keeps the user-activation window for the clipboard), then close.
                if (await actions.copy(snippet)) close()
              }}
              className={itemClasses}
            >
              <span className={cn(iconBoxClasses, 'relative')}>
                <FileCode2 className="size-4" aria-hidden="true" />
                {snippet.isFavorite && (
                  <Star
                    className="absolute -top-1 -right-1 size-3.5 fill-favorite text-favorite"
                    aria-label="Favorite"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  <HighlightText text={snippet.title} ranges={titleMatches} />
                </span>
                <span
                  className={cn(
                    'block truncate text-xs text-muted-foreground',
                    !snippet.description && 'font-mono',
                  )}
                >
                  {subtitle}
                </span>
              </span>
              <span className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
                {collection && (
                  <span className="inline-flex max-w-32 items-center gap-1.5">
                    <ColorDot color={collection.color} className="size-2" />
                    <span className="truncate">{collection.name}</span>
                  </span>
                )}
                <span>{getLanguageLabel(snippet.language)}</span>
              </span>
              {/* Keyboard hint — meaningless on touch screens, so hidden there. */}
              <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground group-data-[selected=true]:flex pointer-coarse:group-data-[selected=true]:hidden">
                <Kbd keys={['↵']} /> Copy
              </span>
            </Command.Item>
          )
        })}
      </Command.Group>
    ),
    collections: visibleCollections.length > 0 && (
      <Command.Group heading="Collections" className={groupClasses}>
        {visibleCollections.map((collection) => (
          <Command.Item
            key={collection.id}
            value={`collection:${collection.id}`}
            onSelect={() => runAndClose(() => navigate(`/collections/${collection.id}`))}
            className={itemClasses}
          >
            <span className={iconBoxClasses}>{collection.icon ?? <ColorDot color={collection.color} />}</span>
            <span className="truncate">{collection.name}</span>
          </Command.Item>
        ))}
      </Command.Group>
    ),
    actions: visibleActions.length > 0 && (
      <Command.Group heading="Actions" className={groupClasses}>
        {visibleActions.map((action) => (
          <Command.Item
            key={action.id}
            value={`action:${action.id}`}
            onSelect={() => runAndClose(action.run)}
            className={itemClasses}
          >
            <span className={iconBoxClasses}>
              <action.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex-1 truncate">{action.label}</span>
            {action.keys && (
              <span className="hidden items-center gap-1 sm:flex">
                {action.keys.map((combo) => (
                  <Kbd key={combo.join('+')} keys={combo} />
                ))}
              </span>
            )}
          </Command.Item>
        ))}
      </Command.Group>
    ),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[max(1rem,10dvh)] max-h-[min(640px,80dvh)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search snippets to copy them, or run a command.
        </DialogDescription>
        <Command
          shouldFilter={false}
          loop
          value={selected}
          onValueChange={(value) => setSelection({ value, query })}
          onKeyDown={handleKeyDown}
          className="flex min-h-0 flex-col"
          label="Command palette"
        >
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search snippets or type a command…"
              className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <Kbd keys={['Esc']} className="hidden sm:inline-flex" />
          </div>

          <Command.List className="max-h-[min(460px,60dvh)] overflow-y-auto overscroll-contain py-1">
            {!hasResults && (
              <Command.Empty className="px-4 pt-8 pb-2 text-center text-sm text-muted-foreground">
                No snippets or commands match “{query}”.
              </Command.Empty>
            )}

            {order.map((section) => (
              <Fragment key={section}>{sections[section]}</Fragment>
            ))}

            {query && (
              <Command.Group heading="Create" className={groupClasses}>
                <Command.Item
                  value="create"
                  onSelect={() => runAndClose(() => openCreate({ title: query }))}
                  className={itemClasses}
                >
                  <span className={iconBoxClasses}>
                    <Plus className="size-4" aria-hidden="true" />
                  </span>
                  <span className="truncate">
                    New snippet titled “<span className="font-medium">{query}</span>”
                  </span>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>

          <div className="hidden items-center gap-4 border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground sm:flex">
            <span className="flex items-center gap-1.5">
              <Kbd keys={['↑', '↓']} /> Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd keys={['↵']} /> Copy / run
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd keys={['Mod', '↵']} /> Open details
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <Kbd keys={['Esc']} /> Close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
