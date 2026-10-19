import { useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLibrary } from '@/features/library/library-context'
import { useSettings } from '@/features/settings/use-settings'
import { formatDateTime, formatRelativeTime } from '@/lib/dates'
import { useBackup } from '../backup-context'

/** Settings → Backup & restore. */
export function BackupSection() {
  const { exportAll, chooseImportFile } = useBackup()
  const { lastBackupAt } = useSettings()
  const { counts } = useLibrary()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportAll()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <span className="text-muted-foreground">Last backup: </span>
        {lastBackupAt ? (
          <time
            dateTime={new Date(lastBackupAt).toISOString()}
            title={formatDateTime(lastBackupAt)}
            className="font-medium"
          >
            {formatRelativeTime(lastBackupAt)}
          </time>
        ) : (
          <span className="font-medium">never</span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleExport()} disabled={counts.all === 0 || isExporting}>
          {isExporting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          Export backup
        </Button>
        <Button variant="outline" onClick={chooseImportFile}>
          <Upload aria-hidden="true" />
          Import backup
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Backups are JSON files you keep. You can also drop a backup file anywhere in the app to import it.
      </p>
    </div>
  )
}
