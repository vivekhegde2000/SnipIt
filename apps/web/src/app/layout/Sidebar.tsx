import { useState, type ComponentProps, type ReactNode } from 'react'
import { Link, useLocation, useMatch, useResolvedPath, useSearchParams } from 'react-router'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { ChevronDown, Hash, Plus, Search } from 'lucide-react'
import { ColorDot } from '@/components/ColorDot'
import { Kbd } from '@/components/Kbd'
import { Logo } from '@/components/Logo'
import { OfflineBadge } from '@/components/OfflineBadge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CollectionActionsMenu } from '@/features/collections/components/CollectionActionsMenu'
import { useCollectionEditor } from '@/features/collections/editor/collection-editor-context'
import { useAppCommands } from '@/features/commands/commands-context'
import { useLibrary } from '@/features/library/library-context'
import { parseTagParam, tagFilterHref } from '@/features/snippets/lib/select-snippets'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { LIBRARY_NAV, SETTINGS_NAV, SIDEBAR_TAG_LIMIT, type NavItemConfig } from './nav-items'
import { ThemeToggle } from './ThemeToggle'

type SidebarProps = {
  /** `full` = desktop sidebar / mobile drawer, `rail` = compact icon bar for tablets. */
  variant: 'full' | 'rail'
  /** Called after any navigation (closes the mobile drawer). */
  onNavigate?: () => void
}

const itemClasses = (isActive: boolean) =>
  cn(
    'group relative isolate flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 lg:h-9',
    'focus-visible:ring-3 focus-visible:ring-sidebar-ring/50 focus-visible:outline-none',
    isActive
      ? 'text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
  )

type SidebarItemProps = Omit<ComponentProps<typeof Link>, 'to' | 'className'> & {
  to: string
  end?: boolean
  /** Matched by path, but shown inactive (e.g. "All snippets" while a tag filter is applied). */
  forceInactive?: boolean
  className?: string
}

/**
 * Navigation link whose active background is one shared element (`layoutId`) that slides between
 * items. Uses `Link` + `useMatch` (not NavLink) so it also works inside Radix `asChild` slots.
 */
function SidebarItem({ to, end = false, forceInactive, className, children, ...rest }: SidebarItemProps) {
  const { pathname } = useResolvedPath(to)
  const isActive = useMatch({ path: pathname, end }) !== null && !forceInactive

  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={cn(itemClasses(isActive), className)}
      {...rest}
    >
      {isActive && (
        <m.span
          layoutId="sidebar-active-item"
          transition={TRANSITION.indicator}
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-lg bg-sidebar-accent"
        />
      )}
      {children}
    </Link>
  )
}

function Count({ value }: { value: number }) {
  return (
    <span className="ml-auto text-xs text-muted-foreground tabular-nums group-aria-[current=page]:text-current">
      {value}
    </span>
  )
}

function SectionHeading({ id, children, action }: { id: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-8 items-center justify-between px-3">
      <h2 id={id} className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {children}
      </h2>
      {action}
    </div>
  )
}

function RailItem({
  to,
  label,
  end,
  onNavigate,
  children,
}: {
  to: string
  label: string
  end?: boolean
  onNavigate?: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarItem
          to={to}
          end={end}
          onClick={onNavigate}
          aria-label={label}
          className="size-10 justify-center px-0 lg:h-10"
        >
          {children}
        </SidebarItem>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function RailNavItem({ item, onNavigate }: { item: NavItemConfig; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <RailItem to={item.to} label={item.label} end={item.end} onNavigate={onNavigate}>
      <Icon className="size-[18px]" aria-hidden="true" />
    </RailItem>
  )
}

export function Sidebar({ variant, onNavigate }: SidebarProps) {
  const { counts, collections, tags } = useLibrary()
  const newSnippet = useNewSnippet()
  const commands = useAppCommands()
  const collectionEditor = useCollectionEditor()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [showAllTags, setShowAllTags] = useState(false)
  const activeTags = location.pathname === '/' ? parseTagParam(searchParams) : []

  const newTriggerProps = {
    ...newSnippet.triggerProps,
    onClick: () => {
      onNavigate?.()
      newSnippet.openNew()
    },
  }
  const openPalette = () => {
    onNavigate?.()
    commands.openPalette()
  }
  const createCollection = () => {
    onNavigate?.()
    collectionEditor.create()
  }

  if (variant === 'rail') {
    return (
      <LayoutGroup id="sidebar-rail">
        <div className="flex h-full flex-col items-center gap-2 py-3">
          <Link
            to="/"
            onClick={onNavigate}
            className="mb-2 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Logo withText={false} />
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-lg" aria-label="New snippet" aria-keyshortcuts="N" {...newTriggerProps}>
                <Plus className="size-5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              New snippet <Kbd keys={['N']} className="ml-1" />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Search and commands"
                aria-keyshortcuts="Control+K Meta+K"
                onClick={openPalette}
              >
                <Search className="size-[18px]" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Search <Kbd keys={['Mod', 'K']} className="ml-1" />
            </TooltipContent>
          </Tooltip>
          <Separator className="my-1 w-8" />
          <nav aria-label="Library" className="flex flex-col items-center gap-1">
            {LIBRARY_NAV.map((item) => (
              <RailNavItem key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </nav>
          {collections.length > 0 && (
            <>
              <Separator className="my-1 w-8" />
              <ScrollArea className="min-h-0 flex-1">
                <nav aria-label="Collections" className="flex flex-col items-center gap-1">
                  {collections.map((collection) => (
                    <RailItem
                      key={collection.id}
                      to={`/collections/${collection.id}`}
                      label={collection.name}
                      onNavigate={onNavigate}
                    >
                      {collection.icon ? (
                        <span className="text-base" aria-hidden="true">
                          {collection.icon}
                        </span>
                      ) : (
                        <ColorDot color={collection.color} className="size-3" />
                      )}
                    </RailItem>
                  ))}
                </nav>
              </ScrollArea>
            </>
          )}
          <div className="mt-auto flex flex-col items-center gap-1 pt-2">
            <OfflineBadge variant="icon" />
            <RailNavItem item={SETTINGS_NAV} onNavigate={onNavigate} />
            <ThemeToggle side="right" align="end" />
          </div>
        </div>
      </LayoutGroup>
    )
  }

  const hiddenTagCount = Math.max(0, tags.length - SIDEBAR_TAG_LIMIT)
  // Always show an active tag, even when it is beyond the collapsed limit.
  const visibleTags = showAllTags
    ? tags
    : tags.filter((t, index) => index < SIDEBAR_TAG_LIMIT || activeTags.includes(t.tag))

  return (
    <LayoutGroup id="sidebar-full">
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Link
            to="/"
            onClick={onNavigate}
            className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Logo />
          </Link>
        </div>

        <div className="space-y-2 px-3">
          <Button size="lg" className="w-full justify-start" aria-keyshortcuts="N" {...newTriggerProps}>
            <Plus aria-hidden="true" />
            New snippet
            <Kbd
              keys={['N']}
              className="ml-auto hidden border-white/20 bg-white/15 text-primary-foreground lg:inline-flex"
            />
          </Button>
          <button
            type="button"
            onClick={openPalette}
            aria-keyshortcuts="Control+K Meta+K"
            className="flex h-9 w-full items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none pointer-coarse:h-10"
          >
            <Search className="size-4" aria-hidden="true" />
            Search…
            <Kbd keys={['Mod', 'K']} className="ml-auto hidden lg:inline-flex" />
          </button>
        </div>

        <ScrollArea className="mt-4 min-h-0 flex-1">
          <div className="space-y-6 px-3 pb-4">
            <nav aria-label="Library" className="space-y-0.5">
              {LIBRARY_NAV.map(({ to, label, icon: Icon, end, count }) => (
                <SidebarItem
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  forceInactive={to === '/' && activeTags.length > 0}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                  {count && <Count value={count(counts)} />}
                </SidebarItem>
              ))}
            </nav>

            <section aria-labelledby="sidebar-collections">
              <SectionHeading
                id="sidebar-collections"
                action={
                  <div className="flex items-center gap-1">
                    <Link
                      to="/collections"
                      onClick={onNavigate}
                      className="rounded px-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      View all
                    </Link>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="New collection"
                          onClick={createCollection}
                          className="text-muted-foreground hover:text-foreground pointer-coarse:size-8"
                        >
                          <Plus aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">New collection</TooltipContent>
                    </Tooltip>
                  </div>
                }
              >
                Collections
              </SectionHeading>
              {collections.length === 0 ? (
                <button
                  type="button"
                  onClick={createCollection}
                  className="mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Create your first collection
                </button>
              ) : (
                <nav aria-labelledby="sidebar-collections" className="space-y-0.5">
                  {collections.map((collection) => (
                    // The ⋯ menu replaces the count on hover/focus (always shown on touch screens).
                    <div key={collection.id} className="group/collection relative">
                      <SidebarItem to={`/collections/${collection.id}`} onClick={onNavigate} className="pr-9">
                        <ColorDot color={collection.color} className="mx-[3px]" />
                        <span className="truncate">{collection.name}</span>
                        <span className="ml-auto transition-opacity group-focus-within/collection:opacity-0 group-hover/collection:opacity-0 pointer-coarse:opacity-0">
                          <Count value={counts.byCollection.get(collection.id) ?? 0} />
                        </span>
                      </SidebarItem>
                      <CollectionActionsMenu
                        collection={collection}
                        triggerSize="icon-xs"
                        triggerClassName="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 transition-opacity group-focus-within/collection:opacity-100 group-hover/collection:opacity-100 data-[state=open]:opacity-100 pointer-coarse:size-8 pointer-coarse:opacity-100"
                      />
                    </div>
                  ))}
                </nav>
              )}
            </section>

            {tags.length > 0 && (
              <section aria-labelledby="sidebar-tags">
                <SectionHeading id="sidebar-tags">Tags</SectionHeading>
                <ul className="flex flex-wrap gap-1.5 px-3 pt-1">
                  <AnimatePresence initial={false}>
                    {visibleTags.map(({ tag, count }) => {
                      const isActive = activeTags.includes(tag)
                      return (
                        // No `layout` here: it would make Motion re-measure the page on every
                        // URL change (e.g. while typing a search).
                        <m.li
                          key={tag}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: TRANSITION.fast }}
                          transition={TRANSITION.base}
                        >
                          <Link
                            to={tagFilterHref(isActive ? [] : [tag])}
                            onClick={onNavigate}
                            aria-current={isActive ? 'true' : undefined}
                            className={cn(
                              'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors duration-150',
                              'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                              isActive
                                ? 'border-primary/40 bg-accent font-medium text-accent-foreground'
                                : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                            )}
                          >
                            <Hash className="size-3 opacity-60" aria-hidden="true" />
                            {tag}
                            <span className="text-muted-foreground tabular-nums">{count}</span>
                          </Link>
                        </m.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
                {hiddenTagCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTags((value) => !value)}
                    aria-expanded={showAllTags}
                    className="mt-2 ml-3 inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {showAllTags ? 'Show less' : `Show all ${tags.length} tags`}
                    <ChevronDown
                      className={cn(
                        'size-3.5 transition-transform duration-200',
                        showAllTags && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </section>
            )}
          </div>
        </ScrollArea>

        <div className="flex shrink-0 items-center gap-1 border-t p-3">
          <SidebarItem to={SETTINGS_NAV.to} onClick={onNavigate} className="flex-1">
            <SETTINGS_NAV.icon className="size-4" aria-hidden="true" />
            {SETTINGS_NAV.label}
          </SidebarItem>
          <OfflineBadge />
          <ThemeToggle side="top" />
        </div>
      </div>
    </LayoutGroup>
  )
}
