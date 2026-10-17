import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'
import { AppCommandsContext, type AppCommandsApi } from './commands-context'
import { CommandPalette } from './CommandPalette'
import { ShortcutsDialog } from './ShortcutsDialog'
import { useGlobalShortcuts } from './use-global-shortcuts'

/** Command palette, keyboard cheat sheet and global keyboard shortcuts. */
export function AppCommandsProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { openNew } = useNewSnippet()

  const openShortcuts = useCallback(() => {
    setPaletteOpen(false)
    setShortcutsOpen(true)
  }, [])

  const api = useMemo<AppCommandsApi>(
    () => ({
      openPalette: () => setPaletteOpen(true),
      togglePalette: () => setPaletteOpen((open) => !open),
      openShortcuts,
    }),
    [openShortcuts],
  )

  useGlobalShortcuts({
    togglePalette: api.togglePalette,
    openPalette: api.openPalette,
    openShortcuts,
    newSnippet: openNew,
  })

  return (
    <AppCommandsContext value={api}>
      {children}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onShowShortcuts={openShortcuts} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </AppCommandsContext>
  )
}
