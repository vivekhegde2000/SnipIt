import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, FileJson, FolderOpen, Loader2, RefreshCcw, Replace, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { getErrorMessage } from '@/db'
import { useLibrary } from '@/features/library/library-context'
import { formatDateTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { BackupError, readBackupFile, type ParsedBackup } from '../lib/backup-format'
import { applyImport, exportLibrary, previewImport } from '../lib/backup-io'
import { isNoopPlan, type ImportMode, type ImportPlan } from '../lib/import-plan'

type ImportDialogProps = {
  file: File
  open: boolean
  onClose: () => void
  onChooseAnother: () => void
}

type ReadState =
  { status: 'reading' } | { status: 'error'; message: string } | { status: 'ready'; backup: ParsedBackup }

const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'positive' | 'muted' }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 text-xl font-semibold tabular-nums',
          tone === 'positive' && value > 0 && 'text-emerald-700 dark:text-emerald-400',
          tone === 'muted' && 'text-muted-foreground',
        )}
      >
        {value.toLocaleString()}
      </dd>
    </div>
  )
}

function ModeOption({
  value,
  selected,
  onSelect,
  icon,
  title,
  children,
}: {
  value: ImportMode
  selected: boolean
  onSelect: (mode: ImportMode) => void
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-[border-color,background-color] duration-150',
        'hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        selected && 'border-primary bg-accent/60 hover:border-primary',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground',
          selected && 'bg-primary text-primary-foreground',
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{children}</span>
      </span>
    </button>
  )
}

/**
 * Reads a backup file, shows exactly what importing it will do (computed by the same planner the
 * import uses), and applies it on confirmation.
 */
export function ImportDialog({ file, open, onClose, onChooseAnother }: ImportDialogProps) {
  const { counts } = useLibrary()
  const [read, setRead] = useState<ReadState>({ status: 'reading' })
  const [mode, setMode] = useState<ImportMode>('merge')
  const [plan, setPlan] = useState<{ mode: ImportMode; value: ImportPlan } | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    let cancelled = false
    readBackupFile(file)
      .then((backup) => !cancelled && setRead({ status: 'ready', backup }))
      .catch((error: unknown) => {
        if (cancelled) return
        const message =
          error instanceof BackupError ? error.message : 'This file could not be read. Is it a SnipIt backup?'
        setRead({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [file])

  const backup = read.status === 'ready' ? read.backup : null
  useEffect(() => {
    if (!backup) return
    let cancelled = false
    previewImport(backup, mode)
      .then((value) => !cancelled && setPlan({ mode, value }))
      .catch((error: unknown) => !cancelled && setRead({ status: 'error', message: getErrorMessage(error) }))
    return () => {
      cancelled = true
    }
  }, [backup, mode])

  const currentPlan = plan?.mode === mode ? plan.value : null
  const replaceWillDelete = mode === 'replace' && counts.all > 0
  const nothingToDo = currentPlan !== null && isNoopPlan(currentPlan)

  const handleImport = async () => {
    if (!backup || isApplying) return
    setIsApplying(true)
    try {
      // Safety net: replacing never happens without a copy of what is being replaced.
      if (replaceWillDelete) await exportLibrary()
      const summary = await applyImport(backup, mode)
      const { added, updated } = summary.snippets
      toast.success(
        mode === 'replace'
          ? `Library restored: ${plural(added, 'snippet')}`
          : `Imported ${plural(added, 'new snippet')}${updated ? `, updated ${updated}` : ''}`,
        {
          description: replaceWillDelete ? 'A backup of your previous data was downloaded first.' : undefined,
        },
      )
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error, 'The import failed. Nothing was changed.'))
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isApplying && onClose()}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <FileJson className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold tracking-tight">Import backup</DialogTitle>
            <DialogDescription className="mt-0.5 truncate">
              {file.name}
              {backup && ` · exported ${formatDateTime(Date.parse(backup.exportedAt))}`}
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6" aria-live="polite">
          {read.status === 'reading' && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Reading backup…
            </p>
          )}

          {read.status === 'error' && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Can't import this file</p>
                <p className="mt-1 text-sm text-muted-foreground">{read.message}</p>
              </div>
            </div>
          )}

          {backup && (
            <>
              <div role="radiogroup" aria-label="Import mode" className="grid gap-2">
                <ModeOption
                  value="merge"
                  selected={mode === 'merge'}
                  onSelect={setMode}
                  icon={<ShieldCheck className="size-4" />}
                  title="Merge with my library (recommended)"
                >
                  Adds new snippets and updates ones edited more recently in the backup. Nothing is deleted.
                </ModeOption>
                <ModeOption
                  value="replace"
                  selected={mode === 'replace'}
                  onSelect={setMode}
                  icon={<Replace className="size-4" />}
                  title="Replace my library"
                >
                  Removes everything on this device, then restores the backup exactly.
                </ModeOption>
              </div>

              {currentPlan ? (
                <section aria-label="What will happen" className="space-y-3">
                  <dl className="grid grid-cols-3 gap-2">
                    <Stat label="New" value={currentPlan.summary.snippets.added} tone="positive" />
                    <Stat label="Updated" value={currentPlan.summary.snippets.updated} />
                    <Stat label="Unchanged" value={currentPlan.summary.snippets.unchanged} tone="muted" />
                  </dl>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderOpen className="size-4 shrink-0" aria-hidden="true" />
                    {(() => {
                      const c = currentPlan.summary.collections
                      const parts = [
                        c.added && `${plural(c.added, 'new collection')}`,
                        c.updated && `${c.updated} updated`,
                        c.merged && `${c.merged} merged into existing`,
                      ].filter(Boolean)
                      return parts.length ? `Collections: ${parts.join(', ')}` : 'No collection changes'
                    })()}
                  </p>
                  {currentPlan.summary.invalid.snippets + currentPlan.summary.invalid.collections > 0 && (
                    <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                      {plural(
                        currentPlan.summary.invalid.snippets + currentPlan.summary.invalid.collections,
                        'damaged record',
                      )}{' '}
                      will be skipped.
                    </p>
                  )}
                  {nothingToDo && (
                    <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Everything in this backup is already in your library.
                    </p>
                  )}
                  {replaceWillDelete && (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
                    >
                      Your current {plural(counts.all, 'snippet')} will be removed. A backup of them is
                      downloaded automatically first.
                    </p>
                  )}
                </section>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Comparing with your library…
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-6 py-3">
          {read.status === 'error' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onChooseAnother}>
                <RefreshCcw aria-hidden="true" />
                Choose another file
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isApplying}>
                Cancel
              </Button>
              <Button
                variant={mode === 'replace' ? 'destructive' : 'default'}
                onClick={() => void handleImport()}
                disabled={!currentPlan || nothingToDo || isApplying}
              >
                {isApplying && <Loader2 className="animate-spin" aria-hidden="true" />}
                {mode === 'replace' ? 'Replace and import' : 'Import'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
