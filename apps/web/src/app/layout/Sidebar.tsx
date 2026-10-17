import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useMatch, useResolvedPath, useSearchParams } from 'react-router'
import { Hash, Plus } from 'lucide-react'
import { ColorDot } from '@/components/ColorDot'
import { Kbd } from '@/components/Kbd'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLibrary } from '@/features/library/library-context'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'
import { parseTagParam, tagFilterHref } from '@/features/snippets/lib/select-snippets'
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
    'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:h-9',
    'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
    'focus-visible:ring-3 focus-visible:ring-sidebar-ring/50 focus-visible:outline-none',
    isActive &&
      'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  )

function Count({ value }: { value: number }) {
  return (
    <span className="ml-auto text-xs text-muted-foreground tabular-nums group-aria-[current=page]:text-current">
      {value}
    </span>
  )
}

function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-8 items-center justify-between px-3">
      <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{children}</h2>
      {action}
    </div>
  )
}

type RailLinkProps = {
  to: string
  label: string
  end?: boolean
  onNavigate?: () => void
  children: ReactNode
}

/**
 * Icon-only link with a tooltip. Uses a plain `Link` + `useMatch` because Radix `Slot`
 * (`TooltipTrigger asChild`) concatenates `className` strings and would stringify NavLink's
 * className function.
 */
function RailLink({ to, label, end = false, onNavigate, children }: RailLinkProps) {
  const { pathname } = useResolvedPath(to)
  const isActive = useMatch({ path: pathname, end }) !== null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          onClick={onNavigate}
          aria-label={label}
          aria-current={isActive ? 'page' : undefined}
          className={cn(itemClasses(isActive), 'size-10 justify-center px-0 lg:size-10')}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function RailNavLink({ item, onNavigate }: { item: NavItemConfig; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <RailLink to={item.to} label={item.label} end={item.end} onNavigate={onNavigate}>
      <Icon className="size-[18px]" aria-hidden="true" />
    </RailLink>
  )
}

export function Sidebar({ variant, onNavigate }: SidebarProps) {
  const { counts, collections, tags } = useLibrary()
  const newSnippet = useNewSnippet()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const activeTags = location.pathname === '/' ? parseTagParam(searchParams) : []

  const handleNew = () => {
    onNavigate?.()
    newSnippet()
  }

  if (variant === 'rail') {
    return (
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
            <Button size="icon" className="size-10" onClick={handleNew} aria-label="New snippet">
              <Plus className="size-5" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            New snippet <Kbd keys={['N']} className="ml-1" />
          </TooltipContent>
        </Tooltip>
        <Separator className="my-1 w-8" />
        <nav aria-label="Library" className="flex flex-col items-center gap-1">
          {LIBRARY_NAV.map((item) => (
            <RailNavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </nav>
        {collections.length > 0 && (
          <>
            <Separator className="my-1 w-8" />
            <ScrollArea className="min-h-0 flex-1">
              <nav aria-label="Collections" className="flex flex-col items-center gap-1">
                {collections.map((collection) => (
                  <RailLink
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
                  </RailLink>
                ))}
              </nav>
            </ScrollArea>
          </>
        )}
        <div className="mt-auto flex flex-col items-center gap-1 pt-2">
          <RailNavLink item={SETTINGS_NAV} onNavigate={onNavigate} />
          <ThemeToggle side="right" align="end" />
        </div>
      </div>
    )
  }

  const visibleTags = tags.slice(0, SIDEBAR_TAG_LIMIT)

  return (
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

      <div className="px-3">
        <Button
          className="h-10 w-full justify-start gap-2 px-3 shadow-sm shadow-primary/20"
          onClick={handleNew}
        >
          <Plus className="size-4" aria-hidden="true" />
          New snippet
          <Kbd
            keys={['N']}
            className="ml-auto hidden border-white/20 bg-white/15 text-primary-foreground lg:inline-flex"
          />
        </Button>
      </div>

      <ScrollArea className="mt-3 min-h-0 flex-1">
        <div className="space-y-5 px-3 pb-4">
          <nav aria-label="Library" className="space-y-0.5">
            {LIBRARY_NAV.map(({ to, label, icon: Icon, end, count }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) => itemClasses(isActive && !(to === '/' && activeTags.length > 0))}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
                {count && <Count value={count(counts)} />}
              </NavLink>
            ))}
          </nav>

          <section aria-labelledby="sidebar-collections">
            <SectionHeading
              action={
                <Link
                  to="/collections"
                  onClick={onNavigate}
                  className="rounded text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  View all
                </Link>
              }
            >
              <span id="sidebar-collections">Collections</span>
            </SectionHeading>
            {collections.length === 0 ? (
              <p className="px-3 py-1 text-xs text-muted-foreground">No collections yet.</p>
            ) : (
              <nav aria-labelledby="sidebar-collections" className="space-y-0.5">
                {collections.map((collection) => (
                  <NavLink
                    key={collection.id}
                    to={`/collections/${collection.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) => itemClasses(isActive)}
                  >
                    <ColorDot color={collection.color} className="mx-[3px]" />
                    <span className="truncate">{collection.name}</span>
                    <Count value={counts.byCollection.get(collection.id) ?? 0} />
                  </NavLink>
                ))}
              </nav>
            )}
          </section>

          {visibleTags.length > 0 && (
            <section aria-labelledby="sidebar-tags">
              <SectionHeading>
                <span id="sidebar-tags">Tags</span>
              </SectionHeading>
              <ul className="flex flex-wrap gap-1.5 px-3 pt-1">
                {visibleTags.map(({ tag, count }) => {
                  const isActive = activeTags.includes(tag)
                  return (
                    <li key={tag}>
                      <Link
                        to={tagFilterHref(isActive ? [] : [tag])}
                        onClick={onNavigate}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors',
                          'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                          isActive
                            ? 'border-primary/30 bg-accent text-accent-foreground'
                            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                        )}
                      >
                        <Hash className="size-3 opacity-60" aria-hidden="true" />
                        {tag}
                        <span className="text-muted-foreground tabular-nums">{count}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </ScrollArea>

      <div className="flex shrink-0 items-center gap-1 border-t p-3">
        <NavLink
          to={SETTINGS_NAV.to}
          onClick={onNavigate}
          className={({ isActive }) => cn(itemClasses(isActive), 'flex-1')}
        >
          <SETTINGS_NAV.icon className="size-4" aria-hidden="true" />
          {SETTINGS_NAV.label}
        </NavLink>
        <ThemeToggle side="top" />
      </div>
    </div>
  )
}
