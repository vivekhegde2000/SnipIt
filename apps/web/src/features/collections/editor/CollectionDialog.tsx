import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { m } from 'motion/react'
import { Ban, FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  COLLECTION_COLORS,
  LIMITS,
  collectionInputSchema,
  type Collection,
  type CollectionColor,
  type CollectionFormValues,
  type CollectionInput,
} from '@snipit/shared'
import { FormField } from '@/components/FormField'
import { RadioGrid } from '@/components/RadioGrid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RepositoryError, collectionRepository, getErrorMessage } from '@/db'
import { useLibrary } from '@/features/library/library-context'
import { describedBy } from '@/lib/field-ids'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { COLLECTION_COLOR_CLASSES } from '../collection-colors'
import { COLLECTION_ICONS } from './collection-icons'

/** Radix radios can't use an empty value, so "no icon" needs a sentinel. */
const NO_ICON = '__none__'

type CollectionDialogProps = {
  open: boolean
  onClose: () => void
  /** Present when editing. */
  collection?: Collection
  onCreated?: (collection: Collection) => void
}

/** First colour not used yet, so new collections are visually distinct by default. */
function suggestColor(used: readonly Collection[]): CollectionColor {
  const taken = new Set(used.map((c) => c.color))
  return (
    COLLECTION_COLORS.find((color) => !taken.has(color)) ??
    COLLECTION_COLORS[used.length % COLLECTION_COLORS.length]!
  )
}

export function CollectionDialog({ open, onClose, collection, onCreated }: CollectionDialogProps) {
  const { collections } = useLibrary()
  const isEdit = collection !== undefined

  const [defaultValues] = useState<CollectionFormValues>(() =>
    collection
      ? { name: collection.name, color: collection.color, icon: collection.icon }
      : { name: '', color: suggestColor(collections), icon: null },
  )

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues, unknown, CollectionInput>({
    resolver: zodResolver(collectionInputSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const preview = useWatch({ control })
  const previewColor = COLLECTION_COLOR_CLASSES[preview.color ?? defaultValues.color]

  const onSubmit = async (values: CollectionInput) => {
    try {
      if (collection) {
        await collectionRepository.update(collection.id, values)
        toast.success('Collection updated')
      } else {
        const created = await collectionRepository.create(values)
        toast.success(`Collection “${created.name}” created`)
        onCreated?.(created)
      }
      onClose()
    } catch (error) {
      if (error instanceof RepositoryError && error.code === 'CONFLICT') {
        setError('name', { message: error.message }, { shouldFocus: true })
        return
      }
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Edit collection' : 'New collection'}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {isEdit
                ? 'Rename it or give it a new look.'
                : 'Group related snippets — for example Git, SQL or Email.'}
            </DialogDescription>
          </div>

          <div className="space-y-5 px-6 py-4">
            {/* Live preview */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3" aria-hidden="true">
              <m.span
                key={`${preview.color}-${preview.icon ?? ''}`}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={TRANSITION.pop}
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-xl text-xl',
                  previewColor.soft,
                )}
              >
                {preview.icon || <FolderOpen className="size-5" />}
              </m.span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {preview.name?.trim() || 'Untitled collection'}
                </span>
                <span className="text-xs text-muted-foreground">Preview</span>
              </span>
            </div>

            <FormField id="collection-name" label="Name" error={errors.name?.message}>
              <Input
                id="collection-name"
                autoFocus
                autoComplete="off"
                placeholder="e.g. Git commands"
                maxLength={LIMITS.collectionNameMax}
                aria-invalid={!!errors.name || undefined}
                aria-describedby={describedBy('collection-name', { error: errors.name })}
                {...register('name')}
              />
            </FormField>

            <div className="grid gap-2">
              <Label id="collection-color-label">Colour</Label>
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <RadioGrid
                    aria-labelledby="collection-color-label"
                    columns={10}
                    value={field.value}
                    onChange={(value) => field.onChange(value as CollectionColor)}
                    options={COLLECTION_COLORS.map((color) => ({
                      value: color,
                      label: COLLECTION_COLOR_CLASSES[color].label,
                      content: (
                        <span className={cn('size-5 rounded-full', COLLECTION_COLOR_CLASSES[color].swatch)} />
                      ),
                    }))}
                    optionClassName={(selected) =>
                      cn('hover:bg-muted', selected && 'bg-muted ring-2 ring-foreground/70 ring-inset')
                    }
                  />
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label id="collection-icon-label">
                Icon <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Controller
                control={control}
                name="icon"
                render={({ field }) => (
                  <RadioGrid
                    aria-labelledby="collection-icon-label"
                    columns={8}
                    value={field.value ?? NO_ICON}
                    onChange={(value) => field.onChange(value === NO_ICON ? null : value)}
                    className="gap-1.5"
                    options={[
                      {
                        value: NO_ICON,
                        label: 'No icon',
                        content: <Ban className="size-4 text-muted-foreground" />,
                      },
                      ...COLLECTION_ICONS.slice(0, 39).map((icon) => ({
                        value: icon,
                        label: icon,
                        content: <span className="text-lg leading-none">{icon}</span>,
                      })),
                    ]}
                    optionClassName={(selected) =>
                      cn('hover:bg-muted', selected && 'bg-accent ring-2 ring-primary/70 ring-inset')
                    }
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-6 py-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isEdit ? 'Save changes' : 'Create collection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
