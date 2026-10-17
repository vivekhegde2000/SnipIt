import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Star } from 'lucide-react'
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
import { describedBy, fieldIds } from '@/lib/field-ids'
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

function valuesFromSnippet(snippet: Snippet): SnippetFormValues {
  const { title, content, description, language, tags, collectionId, isFavorite } = snippet
  return { title, content, description, language, tags, collectionId, isFavorite }
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
  const ids = {
    title: 'snippet-title',
    description: 'snippet-description',
    language: 'snippet-language',
    collection: 'snippet-collection',
    content: 'snippet-content',
    tags: 'snippet-tags',
  }

  return (
    <>
      <Dialog open={open && !isMissing} onOpenChange={(next) => !next && requestClose()}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className={cn(
            'flex flex-col gap-0 overflow-hidden p-0',
            // Full-screen sheet on phones, centred dialog from `sm` up.
            'h-dvh max-h-dvh w-full max-w-none rounded-none',
            'sm:h-auto sm:max-h-[min(92dvh,880px)] sm:max-w-2xl sm:rounded-2xl',
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
                <DialogTitle className="text-lg font-semibold">
                  {isEdit ? 'Edit snippet' : 'New snippet'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {isEdit
                    ? 'Update the details of this snippet.'
                    : 'Save a reusable snippet to your library.'}
                </DialogDescription>
              </div>
              <Controller
                control={control}
                name="isFavorite"
                render={({ field }) => (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 sm:size-9"
                    aria-pressed={field.value}
                    aria-label={field.value ? 'Remove from favorites' : 'Add to favorites'}
                    onClick={() => field.onChange(!field.value)}
                  >
                    <Star
                      className={cn('size-5', field.value && 'fill-favorite text-favorite')}
                      aria-hidden="true"
                    />
                  </Button>
                )}
              />
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
              <FormField id={ids.title} label="Title" error={errors.title?.message}>
                <Input
                  id={ids.title}
                  placeholder="e.g. Undo last commit"
                  autoComplete="off"
                  maxLength={LIMITS.titleMax}
                  autoFocus={!isEdit}
                  aria-invalid={!!errors.title || undefined}
                  aria-describedby={describedBy(ids.title, { error: errors.title })}
                  className="h-10 sm:h-9"
                  {...register('title')}
                />
              </FormField>

              <FormField
                id={ids.description}
                label="Description"
                optional
                error={errors.description?.message}
              >
                <Textarea
                  id={ids.description}
                  rows={2}
                  placeholder="What is it for? When do you use it?"
                  maxLength={LIMITS.descriptionMax}
                  aria-invalid={!!errors.description || undefined}
                  aria-describedby={describedBy(ids.description, { error: errors.description })}
                  className="min-h-16 resize-none"
                  {...register('description')}
                />
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id={ids.language} label="Language">
                  <Controller
                    control={control}
                    name="language"
                    render={({ field }) => (
                      <LanguageSelect
                        id={ids.language}
                        ref={field.ref}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </FormField>
                <FormField id={ids.collection} label="Collection" error={errors.collectionId?.message}>
                  <Controller
                    control={control}
                    name="collectionId"
                    render={({ field }) => (
                      <CollectionSelect
                        id={ids.collection}
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
                name="content"
                render={({ field, fieldState }) => (
                  <FormField
                    id={ids.content}
                    label="Content"
                    error={fieldState.error?.message}
                    onLabelClick={() => editorRef.current?.focus()}
                    labelAside={
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {field.value.length.toLocaleString()} chars
                      </span>
                    }
                  >
                    <div
                      className={cn(
                        'overflow-hidden rounded-lg border border-input bg-code transition-colors',
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
                        ariaDescribedBy={describedBy(ids.content, { error: fieldState.error })}
                        invalid={!!fieldState.error}
                      />
                    </div>
                  </FormField>
                )}
              />

              <Controller
                control={control}
                name="tags"
                render={({ field, fieldState }) => (
                  <FormField
                    id={ids.tags}
                    label="Tags"
                    optional
                    error={fieldState.error?.message}
                    hint="Press Enter or comma to add. Tags are saved in lowercase."
                    labelAside={
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {field.value.length}/{LIMITS.tagsPerSnippetMax}
                      </span>
                    }
                  >
                    <TagInput
                      id={ids.tags}
                      ref={field.ref}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      suggestions={tagSuggestions}
                      invalid={!!fieldState.error}
                      aria-describedby={fieldState.error ? fieldIds(ids.tags).error : fieldIds(ids.tags).hint}
                    />
                  </FormField>
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t bg-muted/40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-3">
              <p className="mr-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Kbd keys={['Mod', 'S']} /> to save
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 sm:h-9 sm:flex-none"
                onClick={requestClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 flex-1 sm:h-9 sm:flex-none sm:px-4"
                disabled={isSubmitting}
              >
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
