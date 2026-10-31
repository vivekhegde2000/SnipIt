import { Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hasTemplateVariables } from '@snipit/shared'
import { useLibrary } from '@/features/library/library-context'
import { copyWithFeedback, type CopyTarget } from '../actions/copy-snippet'
import { TemplateFillContext, type TemplateFillApi } from './template-fill-context'

const loadDialog = () => import('./TemplateFillDialog')
const TemplateFillDialog = lazy(() => loadDialog().then((m) => ({ default: m.TemplateFillDialog })))

/** Warm the dialog once the library is idle, but only for libraries that contain templates. */
const PRELOAD_DELAY_MS = 1500

type FillSession = { id: number; target: CopyTarget; open: boolean }

/** Owns the single "fill in the template" dialog used by every copy action. */
export function TemplateFillProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<FillSession | null>(null)
  const { snippets, isLoading } = useLibrary()
  const hasTemplates = useMemo(
    () => !isLoading && snippets.some((snippet) => hasTemplateVariables(snippet.content)),
    [isLoading, snippets],
  )

  useEffect(() => {
    if (!hasTemplates) return
    const timer = window.setTimeout(() => void loadDialog().catch(() => undefined), PRELOAD_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [hasTemplates])

  // Stable, so every card's memoised actions stay stable too.
  const api = useMemo<TemplateFillApi>(
    () => ({
      async copy(target) {
        if (!hasTemplateVariables(target.content)) return copyWithFeedback(target, target.content)
        setSession((current) => ({ id: (current?.id ?? 0) + 1, target, open: true }))
        return false
      },
      copyAsIs: (target) => copyWithFeedback(target, target.content),
    }),
    [],
  )

  return (
    <TemplateFillContext value={api}>
      {children}
      {session && (
        <Suspense fallback={null}>
          <TemplateFillDialog
            key={session.id}
            target={session.target}
            open={session.open}
            onClose={() => setSession((current) => (current ? { ...current, open: false } : current))}
          />
        </Suspense>
      )}
    </TemplateFillContext>
  )
}
