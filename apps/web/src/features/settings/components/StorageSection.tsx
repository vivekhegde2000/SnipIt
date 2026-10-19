import { useCallback, useEffect, useState } from 'react'
import { HardDrive, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLibrary } from '@/features/library/library-context'
import {
  formatBytes,
  getStorageInfo,
  requestPersistentStorage,
  type StorageInfo,
} from '@/lib/persistent-storage'

/** Settings → Storage: space used and whether the browser may evict the data. */
export function StorageSection() {
  const { snippets } = useLibrary()
  const [info, setInfo] = useState<StorageInfo | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)

  const refresh = useCallback(() => {
    void getStorageInfo().then(setInfo)
  }, [])

  // Re-read when the library changes (usage grows with it).
  useEffect(refresh, [refresh, snippets])

  const protect = async () => {
    setIsRequesting(true)
    const granted = await requestPersistentStorage({ force: true })
    setIsRequesting(false)
    refresh()
    if (granted) toast.success('Your data is now protected from automatic clean-up')
    else
      toast.error('The browser declined', {
        description: 'Installing the app or using it regularly usually allows it. Keep exporting backups.',
      })
  }

  if (!info) return <p className="text-sm text-muted-foreground">Checking storage…</p>

  const percent = info.usage !== null && info.quota ? Math.min(100, (info.usage / info.quota) * 100) : null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm">
          <HardDrive className="size-4 text-muted-foreground" aria-hidden="true" />
          {info.usage !== null ? (
            <>
              <span className="font-medium">{formatBytes(info.usage)}</span>
              <span className="text-muted-foreground">
                used{info.quota ? ` of ${formatBytes(info.quota)} available` : ''}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Usage unknown in this browser</span>
          )}
        </p>
        {percent !== null && (
          <div
            role="meter"
            aria-label="Storage used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            className="h-1.5 max-w-sm overflow-hidden rounded-full bg-muted"
          >
            {/* At least a sliver, so tiny usage is still visible. */}
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(percent, 1)}%` }} />
          </div>
        )}
      </div>

      {info.persisted ? (
        <p className="flex items-start gap-2 text-sm">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span>
            <span className="font-medium">Protected.</span>{' '}
            <span className="text-muted-foreground">
              The browser won't clear your snippets to free up space.
            </span>
          </span>
        </p>
      ) : (
        <div className="space-y-3">
          <p className="flex items-start gap-2 text-sm">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <span>
              <span className="font-medium">Not protected.</span>{' '}
              <span className="text-muted-foreground">
                The browser may clear site data when space runs low. Protect it, and export backups regularly.
              </span>
            </span>
          </p>
          {info.persisted !== null && (
            <Button variant="outline" size="sm" onClick={() => void protect()} disabled={isRequesting}>
              {isRequesting && <Loader2 className="animate-spin" aria-hidden="true" />}
              Protect my data
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
