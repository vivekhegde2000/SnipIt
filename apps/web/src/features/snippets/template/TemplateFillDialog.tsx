import { useMemo, useState, type KeyboardEvent } from 'react'
import { Braces, Loader2 } from 'lucide-react'
import { parseTemplateVariables, resolveTemplateValue, splitTemplate } from '@snipit/shared'
import { Kbd } from '@/components/Kbd'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isModKey } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { copyWithFeedback, type CopyTarget } from '../actions/copy-snippet'
import { recallTemplateValues, rememberTemplateValues } from './template-memory'

type TemplateFillDialogProps = {
  target: CopyTarget
  open: boolean
  onClose: () => void
}

/** Above this many fields the form uses two columns on wider screens. */
const TWO_COLUMN_FROM = 4

/**
 * "Fill in, then copy" for snippets with `{{variables}}`. One field per variable (pre-filled with
 * the values used last time), a live preview of exactly what will be copied, and a "Copy as-is"
 * escape hatch for content whose braces are meant literally.
 */
export function TemplateFillDialog({ target, open, onClose }: TemplateFillDialogProps) {
  const variables = useMemo(() => parseTemplateVariables(target.content), [target.content])
  const parts = useMemo(() => splitTemplate(target.content), [target.content])
  const variablesByName = useMemo(() => new Map(variables.map((v) => [v.name, v])), [variables])
  const [values, setValues] = useState<Record<string, string>>(() => recallTemplateValues(target.id))
  const [isCopying, setIsCopying] = useState(false)

  const resolve = (name: string) => {
    const variable = variablesByName.get(name)
    return variable ? resolveTemplateValue(variable, values) : ''
  }
  const filled = parts.map((part) => (part.type === 'text' ? part.text : resolve(part.name))).join('')
  const emptyCount = variables.filter((v) => !resolveTemplateValue(v, values)).length

  const copy = async (text: string, remember: boolean) => {
    if (isCopying) return
    setIsCopying(true)
    const copied = await copyWithFeedback(target, text)
    setIsCopying(false)
    if (!copied) return
    if (remember) rememberTemplateValues(target.id, values)
    onClose()
  }

  // Enter in a field submits natively; Mod+Enter works from anywhere in the dialog.
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && isModKey(event)) {
      event.preventDefault()
      void copy(filled, true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isCopying && onClose()}>
      <DialogContent className="flex max-h-[min(92dvh,800px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void copy(filled, true)
          }}
          onKeyDown={handleKeyDown}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Braces className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg font-semibold tracking-tight">
                Fill in “{target.title}”
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                Enter the values, then copy. Empty fields use their default, or are left blank.
              </DialogDescription>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
            <fieldset className={cn('grid gap-4', variables.length >= TWO_COLUMN_FROM && 'sm:grid-cols-2')}>
              <legend className="sr-only">Template fields</legend>
              {variables.map((variable, index) => {
                const id = `template-field-${index}`
                return (
                  <div key={variable.name} className="grid gap-2">
                    <Label htmlFor={id} className="font-mono text-[13px]">
                      {variable.name}
                    </Label>
                    <Input
                      id={id}
                      value={values[variable.name] ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [variable.name]: event.target.value }))
                      }
                      placeholder={variable.defaultValue || undefined}
                      autoFocus={index === 0}
                      autoComplete="off"
                      spellCheck={false}
                      enterKeyHint={index === variables.length - 1 ? 'done' : 'next'}
                    />
                  </div>
                )
              })}
            </fieldset>

            <section aria-labelledby="template-preview-heading">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3
                  id="template-preview-heading"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Preview
                </h3>
                {emptyCount > 0 && (
                  <span className="text-xs text-muted-foreground" aria-live="polite">
                    {emptyCount} empty field{emptyCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <pre
                aria-label="Text that will be copied"
                className="max-h-64 overflow-y-auto rounded-xl border bg-code p-3 font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap"
              >
                {parts.map((part, index) => {
                  if (part.type === 'text') return part.text
                  const value = resolve(part.name)
                  return value ? (
                    <mark key={index} className="rounded-sm bg-primary/15 px-0.5 text-foreground">
                      {value}
                    </mark>
                  ) : (
                    // Nothing is copied here; the marker only shows where the blank will be.
                    <span
                      key={index}
                      className="rounded-sm border border-dashed border-muted-foreground/50 px-1 text-muted-foreground italic"
                    >
                      <span className="sr-only">empty: </span>
                      {part.name}
                    </span>
                  )
                })}
              </pre>
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t bg-muted/40 px-5 py-3 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              className="mr-auto"
              disabled={isCopying}
              onClick={() => void copy(target.content, false)}
            >
              Copy as-is
            </Button>
            <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Kbd keys={['↵']} /> to copy
            </p>
            <Button type="button" variant="outline" onClick={onClose} disabled={isCopying}>
              Cancel
            </Button>
            <Button type="submit" className="px-5" disabled={isCopying}>
              {isCopying && <Loader2 className="animate-spin" aria-hidden="true" />}
              Copy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
