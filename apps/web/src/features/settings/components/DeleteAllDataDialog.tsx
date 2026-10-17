import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAllData, getErrorMessage } from '@/db'

const CONFIRMATION_WORD = 'DELETE'

type DeleteAllDataDialogProps = {
  snippetCount: number
  collectionCount: number
}

/** Irreversible wipe of the local library, guarded by typing a confirmation word. */
export function DeleteAllDataDialog({ snippetCount, collectionCount }: DeleteAllDataDialogProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmed = confirmation.trim().toUpperCase() === CONFIRMATION_WORD

  const handleOpenChange = (next: boolean) => {
    if (isDeleting) return
    setOpen(next)
    if (!next) setConfirmation('')
  }

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteAllData()
      setOpen(false)
      setConfirmation('')
      toast.success('All data deleted. You have a fresh start.')
      navigate('/')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete your data. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const isEmpty = snippetCount === 0 && collectionCount === 0

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isEmpty}>
          <Trash2 aria-hidden="true" />
          Delete all data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleDelete()
          }}
          className="contents"
        >
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {snippetCount} snippet{snippetCount === 1 ? '' : 's'} and{' '}
              {collectionCount} collection{collectionCount === 1 ? '' : 's'} from this device. It can't be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="delete-confirmation" className="text-sm font-normal text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{CONFIRMATION_WORD}</span> to
              confirm
            </Label>
            <Input
              id="delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={isDeleting}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            {/* A plain submit button (not AlertDialogAction) so the dialog stays open while deleting. */}
            <Button type="submit" variant="destructive" disabled={!isConfirmed || isDeleting}>
              {isDeleting && <Loader2 className="animate-spin" aria-hidden="true" />}
              Delete everything
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
