import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { FileJson } from 'lucide-react'
import { toast } from 'sonner'
import type { Collection } from '@snipit/shared'
import { getErrorMessage } from '@/db'
import { TRANSITION } from '@/lib/motion'
import { BackupContext, type BackupApi } from './backup-context'
import { exportCollection, exportLibrary } from './lib/backup-io'

// Only needed once a file is chosen; keeps parsing/preview code out of the startup bundle.
const ImportDialog = lazy(() =>
  import('./components/ImportDialog').then((m) => ({ default: m.ImportDialog })),
)

type ImportSession = { id: number; file: File; open: boolean }

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const isFileDrag = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false

/**
 * Backup & restore: export actions, the import file picker and preview dialog, and a window-wide
 * drop target ("drop a backup anywhere to import it").
 */
export function BackupProvider({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [session, setSession] = useState<ImportSession | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const importFile = useCallback((file: File) => {
    setSession((current) => ({ id: (current?.id ?? 0) + 1, file, open: true }))
  }, [])

  const api = useMemo<BackupApi>(
    () => ({
      exportAll: async () => {
        try {
          const result = await exportLibrary()
          toast.success('Backup downloaded', {
            description: `${plural(result.snippets, 'snippet')} and ${plural(result.collections, 'collection')}.`,
          })
        } catch (error) {
          toast.error(getErrorMessage(error, 'Could not create the backup.'))
        }
      },
      exportCollection: async (collection: Collection) => {
        try {
          const result = await exportCollection(collection)
          toast.success(`Exported “${collection.name}”`, { description: plural(result.snippets, 'snippet') })
        } catch (error) {
          toast.error(getErrorMessage(error, 'Could not export the collection.'))
        }
      },
      chooseImportFile: () => inputRef.current?.click(),
      importFile,
    }),
    [importFile],
  )

  // Window-wide drag & drop of a backup file. Only reacts to *files*, so dragging text (e.g.
  // inside the code editor) is unaffected.
  useEffect(() => {
    let depth = 0
    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return
      depth++
      setIsDraggingFile(true)
    }
    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setIsDraggingFile(false)
    }
    const onDragOver = (event: DragEvent) => {
      if (isFileDrag(event)) event.preventDefault() // allow dropping
    }
    const onDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return
      event.preventDefault()
      depth = 0
      setIsDraggingFile(false)
      const file = event.dataTransfer?.files[0]
      if (!file) return
      if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
        toast.error('Drop a SnipIt backup (.json) file to import it.')
        return
      }
      importFile(file)
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [importFile])

  return (
    <BackupContext value={api}>
      {children}

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = '' // allow choosing the same file again
          if (file) importFile(file)
        }}
      />

      {session && (
        <Suspense fallback={null}>
          <ImportDialog
            key={session.id}
            file={session.file}
            open={session.open}
            onClose={() => setSession((current) => (current ? { ...current, open: false } : current))}
            onChooseAnother={() => {
              setSession((current) => (current ? { ...current, open: false } : current))
              inputRef.current?.click()
            }}
          />
        </Suspense>
      )}

      <AnimatePresence>
        {isDraggingFile && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.fast}
            className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-background/80 p-6 backdrop-blur-sm"
            aria-hidden="true"
          >
            <m.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              transition={TRANSITION.pop}
              className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-primary/60 bg-card px-12 py-10 text-center shadow-2xl"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <FileJson className="size-7" />
              </span>
              <p className="text-lg font-semibold">Drop your backup to import it</p>
              <p className="text-sm text-muted-foreground">You'll see a preview before anything changes.</p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </BackupContext>
  )
}
