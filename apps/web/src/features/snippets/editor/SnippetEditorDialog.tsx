import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { m } from 'motion/react'
import { Loader2, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  DEFAULT_LANGUAGE,
  LIMITS,
  snippetInputSchema,
  type LanguageId,
  type Snippet,
  type SnippetFormValues,
  type SnippetInput,
} from '@snipit/shared'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FormField } from '@/components/FormField'
import { Kbd } from '@/components/Kbd'
import { TagInput } from '@/components/TagInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage, snippetRepository } from '@/db'
import { useLibrary } from '@/features/library/library-context'
import { formatRelativeTime } from '@/lib/dates'
import { describedBy, fieldIds } from '@/lib/field-ids'
import { TRANSITION } from '@/lib/motion'
import { isModKey } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { CollectionSelect } from './CollectionSelect'
import { LanguageSelect } from './LanguageSelect'
import { LazyCodeEditor, type CodeEditorHandle } from './LazyCodeEditor'
import type { SnippetEditorRequest } from './snippet-editor-context'

type SnippetEditorDialogProps = {
  request: SnippetEditorRequest
  open: boolean
  onClose: () => void
  /** Language pre-selected for new snippets (from settings). */
  defaultLanguage: LanguageId
}

const EMPTY_VALUES: SnippetFormValues = {
  title: '',
  content: '',
  description: '',
  language: DEFAULT_LANGUAGE,
  tags: [],
  collectionId: null,
  isFavorite: false,
}

const IDS = {
  title: 'snippet-title',
  description: 'snippet-description',
  language: 'snippet-language',
  collection: 'snippet-collection',
  content: 'snippet-content',
  tags: 'snippet-tags',
  favorite: 'snippet-favorite',
} as const

function valuesFromSnippet(snippet: Snippet): SnippetFormValues {
  const { title, content, description, language, tags, collectionId, isFavorite } = snippet
  return { title, content, description, language, tags, collectionId, isFavorite }
}

/** Accessible favorite switch with a small "pop" when it turns on. */
function FavoriteToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      id={IDS.favorite}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border bg-background px-3 py-2.5 text-left transition-[border-color,background-color] duration-150',
        'hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        checked && 'border-favorite/50 bg-favorite/8 hover:border-favorite/60',
      )}
    >
      <m.span
        key={String(checked)}
        initial={checked ? { scale: 0.4, rotate: -30 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={TRANSITION.pop}
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted"
      >
        <Star
          className={cn('size-[18px]', checked ? 'fill-favorite text-favorite' : 'text-muted-foreground')}
          aria-hidden="true"
        />
      </m.span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">Favorite</span>
        <span className="block text-xs text-muted-foreground">
          {checked ? 'Shown in your Favorites' : 'Pin it to your Favorites'}
        </span>
      </span>
    </button>
  )
}

export function SnippetEditorDialog({ request, open, onClose, defaultLanguage }: SnippetEditorDialogProps) {
  const { snippets, collections, tags, isLoading } = useLibrary()

  const editing = request.mode === 'edit' ? snippets.find((s) => s.id === request.snippetId) : undefined
  const isMissing = request.mode === 'edit' && !isLoading && !editing

  // Snapshot the initial values once per session; later library updates must not reset the form.
  const [defaultValues] = useState<SnippetFormValues>(() => {
    if (editing) return valuesFromSnippet(editing)
    const defaults = request.mode === 'create' ? request.defaults : undefined
    return { ...EMPTY_VALUES, language: defaultLanguage, ...defaults }
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SnippetFormValues, unknown, SnippetInput>({
    resolver: zodResolver(snippetInputSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const language = useWatch({ control, name: 'language' })
  const editorRef = useRef<CodeEditorHandle | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // The snippet was deleted (e.g. in another tab) while the editor was open.
  useEffect(() => {
    if (open && isMissing) {
      toast.error('This snippet no longer exists.')
      onClose()
    }
  }, [open, isMissing, onClose])

  const requestClose = () => {
    if (isSubmitting) return
    if (isDirty) setConfirmDiscard(true)
    else onClose()
  }

  const onSubmit = async (values: SnippetInput) => {
    try {
      if (request.mode === 'edit') {
        await snippetRepository.update(request.snippetId, values)
        toast.success('Changes saved')
      } else {
        await snippetRepository.create(values)
        toast.success('Snippet created')
      }
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const submit = handleSubmit(onSubmit)

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    const key = event.key.toLowerCase()
    if (isModKey(event) && (key === 's' || key === 'enter')) {
      event.preventDefault()
      void submit()
    }
  }

  const isEdit = request.mode === 'edit'
  const tagSuggestions = tags.map((t) => t.tag)

  return (
    <>
      <Dialog open={open && !isMissing} onOpenChange={(next) => !next && requestClose()}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className={cn(
            'flex flex-col gap-0 overflow-hidden p-0',
            // Phones: full-screen sheet that slides up.
            'h-dvh max-h-dvh w-full max-w-none rounded-none',
            'max-sm:data-open:zoom-in-100 max-sm:data-open:slide-in-from-bottom-8 max-sm:data-closed:zoom-out-100 max-sm:data-closed:slide-out-to-bottom-8',
            // Tablets: centred, single column, body scrolls.
            'sm:h-auto sm:max-h-[min(92dvh,880px)] sm:max-w-2xl sm:rounded-2xl',
            // Desktop: wide two-column editor with a fixed height (the code editor fills it).
            'lg:h-[min(88dvh,820px)] lg:max-h-none lg:max-w-[min(1160px,calc(100vw-4rem))]',
          )}
        >
          <form
            noValidate
            onSubmit={submit}
            onKeyDown={handleKeyDown}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:pt-4">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {isEdit ? 'Edit snippet' : 'New snippet'}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  {editing
                    ? `Last edited ${formatRelativeTime(editing.updatedAt)}`
                    : 'Save something you reuse — a command, query or message.'}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={requestClose}
                disabled={isSubmitting}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            {/* Body: one scrolling column on small screens, two columns from `lg`. */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain lg:flex-row lg:overflow-hidden">
              {/* Main column */}
              <div className="flex min-w-0 flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-1 lg:overflow-y-auto">
                <FormField id={IDS.title} label="Title" error={errors.title?.message}>
                  <Input
                    id={IDS.title}
                    placeholder="e.g. Undo last commit"
                    autoComplete="off"
                    maxLength={LIMITS.titleMax}
                    autoFocus={!isEdit}
                    aria-invalid={!!errors.title || undefined}
                    aria-describedby={describedBy(IDS.title, { error: errors.title })}
                    className="h-10 text-[15px] font-medium"
                    {...register('title')}
                  />
                </FormField>

                <FormField
                  id={IDS.description}
                  label="Description"
                  optional
                  error={errors.description?.message}
                >
                  <Textarea
                    id={IDS.description}
                    rows={2}
                    placeholder="What is it for? When do you use it?"
                    maxLength={LIMITS.descriptionMax}
                    aria-invalid={!!errors.description || undefined}
                    aria-describedby={describedBy(IDS.description, { error: errors.description })}
                    className="min-h-16 resize-none"
                    {...register('description')}
                  />
                </FormField>

                <Controller
                  control={control}
                  name="content"
                  render={({ field, fieldState }) => (
                    <FormField
                      id={IDS.content}
                      label="Content"
                      error={fieldState.error?.message}
                      onLabelClick={() => editorRef.current?.focus()}
                      className="lg:min-h-0 lg:flex-1 lg:grid-rows-[auto_minmax(0,1fr)]"
                      labelAside={
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {field.value.length.toLocaleString()} chars
                        </span>
                      }
                    >
                      <div
                        className={cn(
                          // The editor reads its height from --editor-height (placeholder too → no jump).
                          'overflow-hidden rounded-xl border border-input bg-code shadow-xs transition-[border-color,box-shadow] duration-150',
                          '[--editor-height:260px] sm:[--editor-height:300px] lg:min-h-60 lg:[--editor-height:100%]',
                          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
                          fieldState.error && 'border-destructive ring-3 ring-destructive/20',
                        )}
                      >
                        <LazyCodeEditor
                          ref={(handle) => {
                            editorRef.current = handle
                            field.ref(handle)
                          }}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          language={language}
                          placeholder="Paste or type your snippet…"
                          ariaLabel="Snippet content"
                          ariaDescribedBy={describedBy(IDS.content, { error: fieldState.error })}
                          invalid={!!fieldState.error}
                        />
                      </div>
                    </FormField>
                  )}
                />
              </div>

              {/* Details column */}
              <aside
                aria-label="Snippet details"
                className="flex flex-col gap-5 border-t bg-muted/30 px-4 py-5 sm:px-6 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l xl:w-88"
              >
                <h3 className="hidden text-xs font-semibold tracking-wider text-muted-foreground uppercase lg:block">
                  Details
                </h3>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                  <FormField id={IDS.language} label="Language">
                    <Controller
                      control={control}
                      name="language"
                      render={({ field }) => (
                        <LanguageSelect
                          id={IDS.language}
                          ref={field.ref}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </FormField>
                  <FormField id={IDS.collection} label="Collection" error={errors.collectionId?.message}>
                    <Controller
                      control={control}
                      name="collectionId"
                      render={({ field }) => (
                        <CollectionSelect
                          id={IDS.collection}
                          ref={field.ref}
                          value={field.value}
                          onChange={field.onChange}
                          collections={collections}
                          invalid={!!errors.collectionId}
                        />
                      )}
                    />
                  </FormField>
                </div>

                <Controller
                  control={control}
                  name="tags"
                  render={({ field, fieldState }) => (
                    <FormField
                      id={IDS.tags}
                      label="Tags"
                      optional
                      error={fieldState.error?.message}
                      hint="Press Enter or comma to add."
                      labelAside={
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {field.value.length}/{LIMITS.tagsPerSnippetMax}
                        </span>
                      }
                    >
                      <TagInput
                        id={IDS.tags}
                        ref={field.ref}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        suggestions={tagSuggestions}
                        invalid={!!fieldState.error}
                        aria-describedby={
                          fieldState.error ? fieldIds(IDS.tags).error : fieldIds(IDS.tags).hint
                        }
                      />
                    </FormField>
                  )}
                />

                <Controller
                  control={control}
                  name="isFavorite"
                  render={({ field }) => <FavoriteToggle checked={field.value} onChange={field.onChange} />}
                />
              </aside>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t bg-muted/40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-3">
              <p className="mr-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Kbd keys={['Mod', 'S']} /> to save
              </p>
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={requestClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none sm:px-5" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                {isEdit ? 'Save changes' : 'Create snippet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard unsaved changes?"
        description="Your edits to this snippet will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={onClose}
      />
    </>
  )
}
