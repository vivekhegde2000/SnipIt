import { useState } from 'react'
import { m } from 'motion/react'
import { ArchiveRestore, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLibrary } from '@/features/library/library-context'
import { useSettings } from '@/features/settings/use-settings'
import { safeStorage } from '@/lib/storage'
import { TRANSITION } from '@/lib/motion'
import { useBackup } from '../backup-context'

const DAY_MS = 24 * 60 * 60 * 1000
const SNOOZE_KEY = 'snipit:backup-reminder-snoozed-until'
/** Remind once the library is worth protecting… */
const MIN_SNIPPETS = 5
/** …and the last backup is this old (or there never was one after the library is this old). */
const BACKUP_MAX_AGE_DAYS = 14
const NEVER_BACKED_UP_GRACE_DAYS = 3
const SNOOZE_DAYS = 7

/**
 * Gentle banner reminding people to back up: data lives only in this browser until Phase 2 sync,
 * and some browsers (notably Safari) may clear site data. Snoozable; disappears after an export.
 */
export function BackupReminder() {
  const { exportAll } = useBackup()
  const { lastBackupAt } = useSettings()
  const { snippets, isLoading } = useLibrary()
  const [now] = useState(() => Date.now())
  const [snoozedUntil, setSnoozedUntil] = useState(() => Number(safeStorage.get(SNOOZE_KEY) ?? 0))

  if (isLoading || snippets.length < MIN_SNIPPETS || snoozedUntil > now) return null

  const oldestCreatedAt = snippets.reduce((oldest, s) => Math.min(oldest, s.createdAt), now)
  const daysSinceBackup = lastBackupAt ? Math.floor((now - lastBackupAt) / DAY_MS) : null
  const isDue =
    daysSinceBackup !== null
      ? daysSinceBackup >= BACKUP_MAX_AGE_DAYS
      : now - oldestCreatedAt >= NEVER_BACKED_UP_GRACE_DAYS * DAY_MS
  if (!isDue) return null

  const snooze = () => {
    const until = Date.now() + SNOOZE_DAYS * DAY_MS
    safeStorage.set(SNOOZE_KEY, String(until))
    setSnoozedUntil(until)
  }

  return (
    <m.aside
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION.base}
      aria-label="Backup reminder"
      className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-accent/50 p-4 sm:flex-row sm:items-center"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <ArchiveRestore className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Back up your snippets</p>
        <p className="text-sm text-muted-foreground">
          Your library is stored only in this browser.{' '}
          {daysSinceBackup === null
            ? 'You have never exported a backup.'
            : `Your last backup was ${daysSinceBackup} days ago.`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={() => void exportAll()}>
          <Download aria-hidden="true" />
          Export now
        </Button>
        <Button size="sm" variant="ghost" onClick={snooze}>
          <X aria-hidden="true" />
          Later
        </Button>
      </div>
    </m.aside>
  )
}
