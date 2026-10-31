import { useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, m } from 'motion/react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { TRASH_RETENTION_DAYS, TRASH_RETENTION_MS, getLanguageLabel, type Snippet } from '@snipit/shared'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage, snippetRepository } from '@/db'
import { useLibrary } from '@/features/library/library-context'
import { useOpenSnippetDetail } from '@/features/snippets/detail/use-snippet-detail'
import { useDelayedFlag } from '@/hooks/use-delayed-flag'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDateTime, formatRelativeTime } from '@/lib/dates'
import { useEntranceAnimation } from '@/lib/initial-screen'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

const DAY_MS = 24 * 60 * 60 * 1000
/** From this many days left, the removal date is highlighted. */
const SOON_DAYS = 3

type PendingDelete = { kind: 'one'; snippet: Snippet } | { kind: 'all'; count: number }

const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`

/** "Removed in 12 days" / "Removed tomorrow" / "Removed today". */
function describeRemoval(deletedAt: number, now: number): { label: string; isSoon: boolean } {
  const daysLeft = Math.ceil((deletedAt + TRASH_RETENTION_MS - now) / DAY_MS)
  const label =
    daysLeft <= 0 ? 'Removed today' : daysLeft === 1 ? 'Removed tomorrow' : `Removed in ${daysLeft} days`
  return { label, isSoon: daysLeft <= SOON_DAYS }
}

function previewLine(snippet: Snippet): string {
  return snippet.description || snippet.content.split('\n').find((line) => line.trim()) || ''
}

type TrashRowProps = {
  snippet: Snippet
  now: number
  onRestore: (snippet: Snippet) => void
  onDeleteForever: (snippet: Snippet) => void
}

function TrashRow({ snippet, now, onRestore, onDeleteForever }: TrashRowProps) {
  const deletedAt = snippet.deletedAt ?? now
  const removal = describeRemoval(deletedAt, now)
  const titleId = `trash-${snippet.id}-title`

  return (
    <m.li
      exit={{ opacity: 0, scale: 0.98, transition: TRANSITION.fast }}
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="truncate text-[15px] leading-snug font-semibold">
          {snippet.title}
        </h2>
        <p
          className={cn('mt-0.5 truncate text-xs text-muted-foreground', !snippet.description && 'font-mono')}
        >
          {previewLine(snippet)}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span className="font-medium">{getLanguageLabel(snippet.language)}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={new Date(deletedAt).toISOString()} title={formatDateTime(deletedAt)}>
            Deleted {formatRelativeTime(deletedAt, now)}
          </time>
          <span aria-hidden="true">·</span>
          <span
            className={cn(removal.isSoon && 'font-medium text-destructive')}
            title={formatDateTime(deletedAt + TRASH_RETENTION_MS)}
          >
            {removal.label}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDeleteForever(snippet)}
          aria-label={`Delete forever: ${snippet.title}`}
        >
          <Trash2 aria-hidden="true" />
          <span className="max-sm:sr-only">Delete forever</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(snippet)}
          aria-label={`Restore: ${snippet.title}`}
        >
          <RotateCcw aria-hidden="true" />
          Restore
        </Button>
      </div>
    </m.li>
  )
}

/**
 * Deleted snippets, restorable for {@link TRASH_RETENTION_DAYS} days. Older ones are purged on
 * app start (see `purgeExpiredTrash`). Permanent deletes are confirmed, because they can't be undone.
 */
export function TrashPage() {
  useDocumentTitle('Trash')
  const { trash, isLoading } = useLibrary()
  const openDetail = useOpenSnippetDetail()
  const showSkeleton = useDelayedFlag(isLoading)
  const enter = useEntranceAnimation()
  // The target outlives `open`, so the dialog's text doesn't change while it animates out.
  const [confirm, setConfirm] = useState<{ open: boolean; target: PendingDelete } | null>(null)
  const askToDelete = (target: PendingDelete) => setConfirm({ open: true, target })
  const pending = confirm?.target
  // One timestamp for the visit keeps every row's "deleted …" and "removed in …" consistent.
  const [now] = useState(Date.now)

  const restore = async (snippet: Snippet) => {
    try {
      const restored = await snippetRepository.restore(snippet.id)
      const lostCollection = snippet.collectionId !== null && restored.collectionId === null
      toast.success(`Restored “${snippet.title}”`, {
        description: lostCollection ? 'Its collection was deleted, so it is now unsorted.' : undefined,
        action: { label: 'Open', onClick: () => openDetail(restored.id) },
      })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const confirmDelete = async () => {
    if (!pending) return
    try {
      if (pending.kind === 'one') {
        await snippetRepository.deleteForever(pending.snippet.id)
        toast.success(`Deleted “${pending.snippet.title}” forever`)
      } else {
        const removed = await snippetRepository.emptyTrash()
        toast.success(`Trash emptied`, { description: `${plural(removed, 'snippet')} deleted forever.` })
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (isLoading) {
    return showSkeleton ? (
      <div className="space-y-3" role="status" aria-label="Loading the Trash">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    ) : null
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Trash"
        description={
          <span aria-live="polite">
            {trash.length > 0
              ? `${plural(trash.length, 'snippet')} · deleted forever ${TRASH_RETENTION_DAYS} days after you delete them`
              : `Deleted snippets stay here for ${TRASH_RETENTION_DAYS} days`}
          </span>
        }
        actions={
          trash.length > 0 && (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => askToDelete({ kind: 'all', count: trash.length })}
            >
              <Trash2 aria-hidden="true" />
              Empty trash
            </Button>
          )
        }
      />

      {trash.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="The Trash is empty"
          description={`When you delete a snippet it waits here for ${TRASH_RETENTION_DAYS} days, so you can restore it if you change your mind.`}
        >
          <Button asChild variant="outline">
            <Link to="/">Back to your snippets</Link>
          </Button>
        </EmptyState>
      ) : (
        <m.ul
          initial={enter ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION.base}
          className="space-y-3"
          aria-label="Deleted snippets"
        >
          <AnimatePresence initial={false}>
            {trash.map((snippet) => (
              <TrashRow
                key={snippet.id}
                snippet={snippet}
                now={now}
                onRestore={(s) => void restore(s)}
                onDeleteForever={(s) => askToDelete({ kind: 'one', snippet: s })}
              />
            ))}
          </AnimatePresence>
        </m.ul>
      )}

      <ConfirmDialog
        open={confirm?.open ?? false}
        onOpenChange={(open) => !open && setConfirm((current) => current && { ...current, open: false })}
        title={pending?.kind === 'one' ? `Delete “${pending.snippet.title}” forever?` : 'Empty the Trash?'}
        description={
          pending?.kind === 'all'
            ? `${plural(pending.count, 'snippet')} will be deleted forever. This can't be undone.`
            : `It will be deleted forever. This can't be undone.`
        }
        confirmLabel={pending?.kind === 'all' ? 'Empty trash' : 'Delete forever'}
        destructive
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
