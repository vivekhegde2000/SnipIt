import { useId, useMemo, useState, type ReactNode } from 'react'
import { Hash, X } from 'lucide-react'
import type { Snippet } from '@snipit/shared'
import { TagInput } from '@/components/TagInput'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLibrary } from '@/features/library/library-context'
import { cn } from '@/lib/utils'
import { pluralSnippets } from './use-bulk-actions'

type BulkTagsPopoverProps = {
  snippets: readonly Snippet[]
  onApply: (add: string[], remove: string[]) => void
  /** The trigger button (rendered via `asChild`). */
  children: ReactNode
}

/**
 * Add and remove tags on many snippets at once. Added tags go to every selected snippet; a tag
 * marked for removal is taken off every selected snippet that has it. One Apply, one Undo.
 */
export function BulkTagsPopover({ snippets, onApply, children }: BulkTagsPopoverProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[min(22rem,calc(100vw-2rem))] gap-3 p-3"
      >
        {/* Remounted on every open, so it always starts empty. */}
        {open && (
          <BulkTagsForm
            snippets={snippets}
            onCancel={() => setOpen(false)}
            onApply={(add, remove) => {
              setOpen(false)
              onApply(add, remove)
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

function BulkTagsForm({
  snippets,
  onApply,
  onCancel,
}: {
  snippets: readonly Snippet[]
  onApply: (add: string[], remove: string[]) => void
  onCancel: () => void
}) {
  const { tags: libraryTags } = useLibrary()
  const addId = useId()
  const removeId = useId()
  const [add, setAdd] = useState<string[]>([])
  const [remove, setRemove] = useState<ReadonlySet<string>>(new Set())

  /** Tags on the selected snippets, most common first: the ones that can be removed. */
  const present = useMemo(() => {
    const counts = new Map<string, number>()
    for (const snippet of snippets)
      for (const tag of snippet.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [snippets])

  const suggestions = useMemo(() => libraryTags.map((t) => t.tag), [libraryTags])
  const toggleRemove = (tag: string) =>
    setRemove((current) => {
      const next = new Set(current)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })

  const hasChanges = add.length > 0 || remove.size > 0

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (hasChanges) onApply(add, [...remove])
      }}
    >
      <p className="font-medium">Tags for {pluralSnippets(snippets.length)}</p>

      <div className="space-y-1.5">
        <label htmlFor={addId} className="text-xs font-medium text-muted-foreground">
          Add to all
        </label>
        <TagInput
          id={addId}
          value={add}
          onChange={setAdd}
          suggestions={suggestions}
          placeholder="Type a tag…"
        />
      </div>

      {present.length > 0 && (
        <div className="space-y-1.5">
          <p id={removeId} className="text-xs font-medium text-muted-foreground">
            Remove from all <span className="font-normal">(select the tags to remove)</span>
          </p>
          <ul aria-labelledby={removeId} className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
            {present.map(([tag, count]) => {
              const marked = remove.has(tag)
              return (
                <li key={tag}>
                  {/* Name = visible text ("ops 3 snippets"), so voice control can target it. */}
                  <button
                    type="button"
                    aria-pressed={marked}
                    onClick={() => toggleRemove(tag)}
                    className={cn(
                      'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      marked
                        ? 'border-destructive/40 bg-destructive/10 text-destructive line-through'
                        : 'text-foreground/80 hover:bg-muted',
                    )}
                  >
                    {marked ? (
                      <X className="size-3" aria-hidden="true" />
                    ) : (
                      <Hash className="size-3 opacity-60" aria-hidden="true" />
                    )}
                    {tag}
                    <span className="text-muted-foreground tabular-nums">
                      {count}
                      <span className="sr-only"> {count === 1 ? 'snippet' : 'snippets'}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!hasChanges}>
          Apply
        </Button>
      </div>
    </form>
  )
}
