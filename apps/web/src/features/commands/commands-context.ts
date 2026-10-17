import { createContext, useContext } from 'react'

export type AppCommandsApi = {
  openPalette: () => void
  togglePalette: () => void
  openShortcuts: () => void
}

export const AppCommandsContext = createContext<AppCommandsApi | null>(null)

export function useAppCommands(): AppCommandsApi {
  const context = useContext(AppCommandsContext)
  if (!context) throw new Error('useAppCommands must be used within <AppCommandsProvider>')
  return context
}
