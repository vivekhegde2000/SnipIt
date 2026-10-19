import { Outlet, useLocation } from 'react-router'
import { m } from 'motion/react'
import { useBreakpoint } from '@/hooks/use-media-query'
import { BackupProvider } from '@/features/backup/BackupProvider'
import { CollectionEditorProvider } from '@/features/collections/editor/CollectionEditorProvider'
import { AppCommandsProvider } from '@/features/commands/AppCommandsProvider'
import { LibraryProvider } from '@/features/library/LibraryProvider'
import { SnippetDetailHost } from '@/features/snippets/detail/SnippetDetailHost'
import { SnippetEditorProvider } from '@/features/snippets/editor/SnippetEditorProvider'
import { isInitialScreen } from '@/lib/initial-screen'
import { TRANSITION } from '@/lib/motion'
import { AppLaunchEffects } from './AppLaunchEffects'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { NewSnippetFab } from './NewSnippetFab'
import { ScrollToTop } from './ScrollToTop'
import { Sidebar } from './Sidebar'

/**
 * Responsive shell:
 * - desktop (≥1024px): full sidebar
 * - tablet (768–1023px): icon rail
 * - phone (<768px): top bar + drawer, bottom navigation, floating "new" button
 */
export function AppLayout() {
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint === 'mobile'
  const location = useLocation()

  // Provider order matters: the snippet editor can create collections (Collection select),
  // and the command layer (palette + shortcuts) drives the editors, backup and the detail view.
  return (
    <LibraryProvider>
      <CollectionEditorProvider>
        <SnippetEditorProvider>
          <BackupProvider>
            <AppCommandsProvider>
              <AppLaunchEffects />
              <a
                href="#main"
                className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
              >
                Skip to content
              </a>
              <ScrollToTop />

              <div className="flex min-h-dvh">
                {!isMobile && (
                  <aside
                    aria-label="Sidebar"
                    data-variant={breakpoint === 'desktop' ? 'full' : 'rail'}
                    className="sticky top-0 h-dvh shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground data-[variant=full]:w-64 data-[variant=rail]:w-[72px]"
                  >
                    <Sidebar variant={breakpoint === 'desktop' ? 'full' : 'rail'} />
                  </aside>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                  {isMobile && <MobileHeader />}
                  <main
                    id="main"
                    tabIndex={-1}
                    className="flex-1 px-4 pt-5 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+6rem)] outline-none sm:px-6 md:px-8 md:pt-8 md:pb-12 2xl:px-12 2xl:pt-10"
                  >
                    {/*
                No max-width: content uses the full width on large monitors (grids are fluid).
                Reading/form pages constrain themselves. Keyed fade gives a subtle page transition
                without delaying navigation (no exit animation to wait for); the first page of a
                visit appears without it (see lib/initial-screen).
              */}
                    <m.div
                      key={location.pathname}
                      initial={isInitialScreen() ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={TRANSITION.base}
                    >
                      <Outlet />
                    </m.div>
                  </main>
                </div>
              </div>

              {isMobile && (
                <>
                  <NewSnippetFab />
                  <BottomNav />
                </>
              )}

              <SnippetDetailHost />
            </AppCommandsProvider>
          </BackupProvider>
        </SnippetEditorProvider>
      </CollectionEditorProvider>
    </LibraryProvider>
  )
}
