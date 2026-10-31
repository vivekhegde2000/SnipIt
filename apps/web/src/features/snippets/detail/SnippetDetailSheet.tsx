import { useMemo } from 'react'
import { Link } from 'react-router'
import { Braces, Hash, Pencil, Share2, Trash2, X } from 'lucide-react'
import { getLanguageLabel, parseTemplateVariables, type Collection, type Snippet } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import { CopyButton } from '@/components/CopyButton'
import { FavoriteButton } from '@/components/FavoriteButton'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { preloadShareCodec } from '@/features/share/share-link'
import { tagFilterHref } from '@/features/snippets/lib/select-snippets'
import { formatDateTime, formatRelativeTime } from '@/lib/dates'
import { SnippetActionsMenu } from '../actions/SnippetActionsMenu'
import { handleSnippetShortcut } from '../actions/snippet-shortcuts'
import { useSnippetActions } from '../actions/use-snippet-actions'
import { CodeBlock } from '../code/CodeBlock'

type SnippetDetailSheetProps = {
  snippet: Snippet
  collection?: Collection
  open: boolean
  onClose: () => void
}

function Stat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium" title={title}>
        {value}
      </dd>
    </div>
  )
}

/** Full view of one snippet: highlighted content, details, and every action. */
export function SnippetDetailSheet({ snippet, collection, open, onClose }: SnippetDetailSheetProps) {
  const actions = useSnippetActions()
  const lineCount = snippet.content.split('\n').length
  const variables = useMemo(() => parseTemplateVariables(snippet.content), [snippet.content])

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        onKeyDown={(event) => handleSnippetShortcut(event, snippet, actions)}
        // Full width on phones; must use the same `data-[side=right]` variant as the base sheet
        // classes (which set w-3/4) or it would lose on specificity.
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl"
      >
        {/* Header */}
        <div className="border-b px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">
              {getLanguageLabel(snippet.language)}
            </span>
            {collection && (
              <Link
                to={`/collections/${collection.id}`}
                className="inline-flex h-6 max-w-48 items-center gap-1.5 rounded-md bg-muted px-2 text-xs font-medium transition-colors hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <ColorDot color={collection.color} className="size-2" />
                <span className="truncate">{collection.name}</span>
              </Link>
            )}
            <div className="ml-auto flex items-center gap-0.5">
              <FavoriteButton
                size="icon"
                isFavorite={snippet.isFavorite}
                onToggle={() => void actions.toggleFavorite(snippet)}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Share link"
                title="Share link"
                onPointerEnter={preloadShareCodec}
                onFocus={preloadShareCodec}
                onClick={() => void actions.share(snippet)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Share2 aria-hidden="true" />
              </Button>
              <SnippetActionsMenu snippet={snippet} actions={actions} showOpen={false} triggerSize="icon" />
              <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                <X aria-hidden="true" />
              </Button>
            </div>
          </div>
          <SheetTitle className="mt-3 text-xl leading-tight font-semibold tracking-tight">
            {snippet.title}
          </SheetTitle>
          <SheetDescription className={snippet.description ? 'mt-1.5 text-sm text-pretty' : 'sr-only'}>
            {snippet.description || `Details of ${snippet.title}`}
          </SheetDescription>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <section aria-label="Content" className="overflow-hidden rounded-xl border bg-code">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {lineCount} line{lineCount === 1 ? '' : 's'} · {snippet.content.length.toLocaleString()} chars
              </span>
              <CopyButton
                size="sm"
                variant="outline"
                className="ml-auto"
                onCopy={() => actions.copy(snippet)}
              />
            </div>
            <CodeBlock code={snippet.content} language={snippet.language} className="p-4 text-[13px]" />
          </section>

          {variables.length > 0 && (
            <section
              aria-labelledby="detail-template"
              className="flex gap-3 rounded-xl border border-primary/25 bg-accent/50 p-3.5"
            >
              <Braces className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 text-sm">
                <h3 id="detail-template" className="font-medium">
                  Template with {variables.length} field{variables.length === 1 ? '' : 's'}
                </h3>
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {variables.map((variable) => (
                    <code
                      key={variable.name}
                      className="rounded bg-background px-1.5 py-0.5 font-mono text-xs"
                      title={variable.defaultValue ? `Default: ${variable.defaultValue}` : undefined}
                    >
                      {variable.name}
                    </code>
                  ))}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Copying asks for these values first.{' '}
                  <button
                    type="button"
                    onClick={() => void actions.copyAsIs(snippet)}
                    className="rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    Copy as-is
                  </button>
                </p>
              </div>
            </section>
          )}

          {snippet.tags.length > 0 && (
            <section aria-labelledby="detail-tags">
              <h3
                id="detail-tags"
                className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Tags
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {snippet.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      to={tagFilterHref([tag])}
                      className="inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <Hash className="size-3 opacity-60" aria-hidden="true" />
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="detail-stats">
            <h3
              id="detail-stats"
              className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Details
            </h3>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Copied" value={`${snippet.copyCount}×`} />
              <Stat
                label="Last used"
                value={snippet.lastCopiedAt ? formatRelativeTime(snippet.lastCopiedAt) : 'Never'}
                title={snippet.lastCopiedAt ? formatDateTime(snippet.lastCopiedAt) : undefined}
              />
              <Stat
                label="Updated"
                value={formatRelativeTime(snippet.updatedAt)}
                title={formatDateTime(snippet.updatedAt)}
              />
              <Stat
                label="Created"
                value={formatRelativeTime(snippet.createdAt)}
                title={formatDateTime(snippet.createdAt)}
              />
            </dl>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t bg-muted/40 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void actions.remove(snippet)}
          >
            <Trash2 aria-hidden="true" />
            <span className="max-sm:sr-only">Delete</span>
          </Button>
          <Button variant="outline" className="ml-auto" onClick={() => actions.edit(snippet)}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <CopyButton
            onCopy={() => actions.copy(snippet)}
            label={variables.length > 0 ? 'Fill in & copy' : 'Copy snippet'}
            className="px-5"
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
