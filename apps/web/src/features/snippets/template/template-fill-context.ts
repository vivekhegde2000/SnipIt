import { createContext, useContext } from 'react'
import type { CopyTarget } from '../actions/copy-snippet'

export type TemplateFillApi = {
  /**
   * Copies the target's content. A template opens the fill-in form instead and resolves `false`
   * (nothing was copied yet); plain content is copied straight away and resolves `true`.
   */
  copy: (target: CopyTarget) => Promise<boolean>
  /** Copies the raw content, placeholders and all. */
  copyAsIs: (target: CopyTarget) => Promise<boolean>
}

export const TemplateFillContext = createContext<TemplateFillApi | null>(null)

export function useTemplateFill(): TemplateFillApi {
  const context = useContext(TemplateFillContext)
  if (!context) throw new Error('useTemplateFill must be used within <TemplateFillProvider>')
  return context
}
