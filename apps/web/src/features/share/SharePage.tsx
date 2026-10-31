import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { m } from 'motion/react'
import { Braces, Check, Hash, LibraryBig, Link2Off, Plus, ShieldCheck } from 'lucide-react'
import { getLanguageLabel, hasTemplateVariables } from '@snipit/shared'
import { CopyButton } from '@/components/CopyButton'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLibrary } from '@/features/library/library-context'
import { CodeBlock } from '@/features/snippets/code/CodeBlock'
import { useSnippetEditor } from '@/features/snippets/editor/snippet-editor-context'
import { useTemplateFill } from '@/features/snippets/template/template-fill-context'
import { useDelayedFlag } from '@/hooks/use-delayed-flag'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useEntranceAnimation } from '@/lib/initial-screen'
import { TRANSITION } from '@/lib/motion'
import { ShareLinkError, readShareFragment, type SharedSnippet } from './share-link'

type ReadState = { fragment: string } & (
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; snippet: SharedSnippet }
)

/**
 * Opens a share link (`/share#v1.…`). The snippet is decoded in the browser and shown read-only,
 * with Copy and "Save to my library" (the normal editor, pre-filled). Nothing is stored until the
 * user saves it.
 */
export function SharePage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const { snippets } = useLibrary()
  const { openCreate } = useSnippetEditor()
  const templates = useTemplateFill()
  const enter = useEntranceAnimation()

  const [read, setRead] = useState<ReadState>({ fragment: hash, status: 'loading' })
  // A different link opened in the same tab: start over ("adjust state while rendering").
  if (read.fragment !== hash) setRead({ fragment: hash, status: 'loading' })

  useEffect(() => {
    let cancelled = false
    readShareFragment(hash).then(
      (snippet) => {
        if (!cancelled) setRead({ fragment: hash, status: 'ready', snippet })
      },
      (error: unknown) => {
        if (cancelled) return
        const message =
          error instanceof ShareLinkError
            ? error.message
            : 'This share link could not be opened. Please try again.'
        setRead({ fragment: hash, status: 'error', message })
      },
    )
    return () => {
      cancelled = true
    }
  }, [hash])

  const shared = read.status === 'ready' ? read.snippet : null
  const showSkeleton = useDelayedFlag(read.status === 'loading')
  useDocumentTitle(shared ? shared.title : 'Shared snippet')

  // Already saved? (Same title and content.) Offer to open it instead of saving a duplicate.
  const existing = useMemo(
    () =>
      shared ? snippets.find((s) => s.title === shared.title && s.content === shared.content) : undefined,
    [shared, snippets],
  )

  // After "Save to my library", show the new snippet in the library — but only once the live
  // library has it, or the detail view would briefly see an unknown id and close itself.
  const [savedId, setSavedId] = useState<string | null>(null)
  useEffect(() => {
    if (savedId && snippets.some((s) => s.id === savedId)) {
      // Replace: Back then returns to where the user came from, not to this link.
      navigate(`/?snippet=${savedId}`, { replace: true })
    }
  }, [savedId, snippets, navigate])

  if (read.status === 'loading') {
    return showSkeleton ? (
      <div className="max-w-4xl space-y-4" role="status" aria-label="Opening shared snippet">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    ) : null
  }

  if (read.status === 'error') {
    return (
      <>
        <h1 className="sr-only">Shared snippet</h1>
        <EmptyState icon={Link2Off} title="Can't open this link" description={read.message} className="mt-8">
          <Button asChild variant="outline">
            <Link to="/">Go to your snippets</Link>
          </Button>
        </EmptyState>
      </>
    )
  }

  const snippet = read.snippet
  const isTemplate = hasTemplateVariables(snippet.content)
  const lineCount = snippet.content.split('\n').length

  const save = () =>
    openCreate(
      {
        title: snippet.title,
        content: snippet.content,
        description: snippet.description,
        language: snippet.language,
        tags: snippet.tags,
      },
      { onCreated: (created) => setSavedId(created.id) },
    )

  return (
    <m.div
      initial={enter ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION.base}
      className="max-w-4xl space-y-6"
    >
      <PageHeader
        title={snippet.title}
        description="Shared with you. It isn't saved anywhere until you add it to your library."
        actions={
          <>
            {existing ? (
              <Button variant="outline" onClick={() => navigate(`/?snippet=${existing.id}`)}>
                <Check aria-hidden="true" />
                In your library
              </Button>
            ) : (
              <Button variant="outline" onClick={save}>
                <Plus aria-hidden="true" />
                Save to my library
              </Button>
            )}
            <CopyButton
              onCopy={() => templates.copy({ title: snippet.title, content: snippet.content })}
              label={isTemplate ? 'Fill in & copy' : 'Copy'}
              className="px-5"
            />
          </>
        }
      />

      <section aria-label="Shared snippet" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 items-center rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">
            {getLanguageLabel(snippet.language)}
          </span>
          {isTemplate && (
            <span className="inline-flex h-6 items-center gap-1 rounded-md border border-primary/25 px-2 text-xs font-medium text-primary">
              <Braces className="size-3" aria-hidden="true" />
              Template
            </span>
          )}
          {snippet.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs text-muted-foreground"
            >
              <Hash className="size-3 opacity-60" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>

        {snippet.description && <p className="text-sm text-pretty">{snippet.description}</p>}

        <div className="overflow-hidden rounded-xl border bg-code">
          <div className="border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground tabular-nums">
            {lineCount} line{lineCount === 1 ? '' : 's'} · {snippet.content.length.toLocaleString()} chars
          </div>
          <CodeBlock code={snippet.content} language={snippet.language} className="p-4 text-[13px]" />
        </div>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
        The snippet travels inside the link itself and was opened in your browser — nothing was uploaded or
        downloaded from a server.
      </p>

      {snippets.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LibraryBig className="size-4 shrink-0" aria-hidden="true" />
          New to SnipIt? It keeps the commands and messages you reuse, ready to copy in two keystrokes.
        </p>
      )}
    </m.div>
  )
}
